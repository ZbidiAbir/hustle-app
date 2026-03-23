"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";

type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender_name?: string;
};

type Job = {
  id: string;
  title: string;
  description: string;
  customer_id: string;
  worker_id: string | null;
  status: string;
  price: number;
  location: string;
};

type Worker = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  application_id?: string;
  application_status?: string;
};

export default function CustomerChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWorkerSelector, setShowWorkerSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const workerIdFromUrl = searchParams.get("worker");

  // Function to fetch messages for the selected worker
  const fetchMessagesForWorker = async (workerId: string | null) => {
    if (!workerId) {
      setMessages([]);
      return;
    }

    try {
      // Fetch messages where the sender is either the customer or the selected worker
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("job_id", jobId)
        .or(`sender_id.eq.${currentUser?.id},sender_id.eq.${workerId}`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Add sender names
      const messagesWithNames = await Promise.all(
        (data || []).map(async (msg) => {
          let senderName = "Unknown";

          if (msg.sender_id === currentUser?.id) {
            senderName = "You";
          } else {
            const senderWorker = workers.find((w) => w.id === msg.sender_id);
            senderName = senderWorker?.full_name || "Worker";
          }

          return { ...msg, sender_name: senderName };
        })
      );

      setMessages(messagesWithNames);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Function to update URL with selected worker
  const updateUrlWithWorker = (workerId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("worker", workerId);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);

        // 1. Check user authentication
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setCurrentUser(user);

        // 2. Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .maybeSingle();

        if (jobError || !jobData) {
          setError("Job not found");
          return;
        }

        // Verify user is the owner
        if (jobData.customer_id !== user.id) {
          router.push("/customer/my-jobs");
          return;
        }

        setJob(jobData);

        // 3. Fetch applications for this job
        const { data: applicationsData, error: appsError } = await supabase
          .from("applications")
          .select("id, worker_id, status")
          .eq("job_id", jobId);

        if (appsError) throw appsError;

        if (applicationsData && applicationsData.length > 0) {
          // 4. Fetch worker profiles separately
          const workerIds = applicationsData.map((app) => app.worker_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", workerIds);

          if (profilesError) throw profilesError;

          // 5. Combine the data
          const workersList = applicationsData.map((app) => {
            const profile = profilesData?.find((p) => p.id === app.worker_id);
            return {
              id: app.worker_id,
              full_name: profile?.full_name || "Unknown Worker",
              email: profile?.email || "unknown@email.com",
              avatar_url: profile?.avatar_url,
              application_id: app.id,
              application_status: app.status,
            };
          });

          setWorkers(workersList);

          // Auto-select worker based on URL parameter or default
          let initialWorker = null;

          // Check if workerId is in URL and exists in workersList
          if (workerIdFromUrl) {
            initialWorker = workersList.find((w) => w.id === workerIdFromUrl);
          }

          // If not found in URL or URL param is invalid, use assigned worker or first worker
          if (!initialWorker) {
            if (jobData.worker_id) {
              initialWorker = workersList.find(
                (w) => w.id === jobData.worker_id
              );
            } else if (workersList.length > 0) {
              initialWorker = workersList[0];
            }
          }

          if (initialWorker) {
            setSelectedWorker(initialWorker);
            // Update URL with the selected worker if not already set
            if (!workerIdFromUrl || workerIdFromUrl !== initialWorker.id) {
              updateUrlWithWorker(initialWorker.id);
            }
            // Fetch messages for the initial worker
            await fetchMessagesForWorker(initialWorker.id);
          }
        } else {
          setWorkers([]);
          setSelectedWorker(null);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error:", error);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId, workerIdFromUrl]);

  // Fetch messages when selected worker changes
  useEffect(() => {
    if (selectedWorker && currentUser) {
      fetchMessagesForWorker(selectedWorker.id);
    } else {
      setMessages([]);
    }
  }, [selectedWorker, currentUser]);

  // Real-time subscription
  useEffect(() => {
    if (!jobId || !currentUser || !selectedWorker) return;

    const subscription = supabase
      .channel(`messages:${jobId}:${selectedWorker.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `job_id=eq.${jobId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          // Only add message if it's from the current user or the selected worker
          if (
            newMsg.sender_id === currentUser.id ||
            newMsg.sender_id === selectedWorker.id
          ) {
            // Determine sender name
            let senderName = "Unknown";
            if (newMsg.sender_id === currentUser.id) {
              senderName = "You";
            } else {
              const senderWorker = workers.find(
                (w) => w.id === newMsg.sender_id
              );
              senderName = senderWorker?.full_name || "Worker";
            }

            setMessages((prev) => [
              ...prev,
              { ...newMsg, sender_name: senderName },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [jobId, currentUser, workers, selectedWorker]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !job || !selectedWorker) return;

    setSending(true);

    try {
      const { error } = await supabase.from("messages").insert([
        {
          job_id: jobId,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          read: false,
        },
      ]);

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      alert("Error sending message");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const switchWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    updateUrlWithWorker(worker.id);
    setShowWorkerSelector(false);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-linear-to-br from-purple-500 to-pink-500",
      "bg-linear-to-br from-blue-500 to-cyan-500",
      "bg-linear-to-br from-green-500 to-emerald-500",
      "bg-linear-to-br from-yellow-500 to-amber-500",
      "bg-linear-to-br from-red-500 to-rose-500",
      "bg-linear-to-br from-indigo-500 to-violet-500",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            Pending
          </span>
        );
      case "accepted":
        return (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-linear-to-br from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-red-600 mb-6">{error || "Job not found"}</p>
          <Link
            href="/customer/my-jobs"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to my jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className=" ">
          <div className="flex items-center justify-between h-20">
            {/* Left section */}
            <div className="flex items-center space-x-4">
              <Link
                href="/customer/dashboard/my-jobs"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
              >
                <svg
                  className="w-5 h-5 text-gray-600 group-hover:text-gray-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>

              {/* Worker selector */}
              {workers.length > 0 && selectedWorker ? (
                <div className="flex items-center gap-3">
                  {/* Selected worker avatar */}
                  <div
                    className="relative cursor-pointer"
                    onClick={() => setShowWorkerSelector(!showWorkerSelector)}
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${getAvatarColor(
                        selectedWorker?.id || ""
                      )} flex items-center justify-center text-white font-bold text-lg shadow-md`}
                    >
                      {selectedWorker?.full_name?.charAt(0).toUpperCase() ||
                        "W"}
                    </div>
                    {workers.length > 1 && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                        {workers.length}
                      </div>
                    )}
                  </div>

                  {/* Worker selector dropdown */}
                  {showWorkerSelector && workers.length > 1 && (
                    <div className="absolute top-20 left-24 mt-2 w-64 bg-white rounded-xl shadow-xl border z-50">
                      <div className="p-3 border-b">
                        <h3 className="font-medium text-gray-900">
                          Select Worker
                        </h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {workers.map((worker) => (
                          <button
                            key={worker.id}
                            onClick={() => switchWorker(worker)}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition ${
                              selectedWorker?.id === worker.id
                                ? "bg-blue-50"
                                : ""
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full ${getAvatarColor(
                                worker.id
                              )} flex items-center justify-center text-white text-xs font-medium`}
                            >
                              {worker.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-gray-900">
                                {worker.full_name}
                              </p>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(
                                  worker.application_status || ""
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Worker info */}
                  <div>
                    <h1 className="font-semibold text-gray-900 flex items-center gap-2">
                      {job.title}
                      <span className="text-sm font-normal text-gray-400">
                        •
                      </span>
                      <span className="text-sm font-normal text-gray-500">
                        ${job.price}
                      </span>
                    </h1>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Chat with</span>
                      <span className="font-medium text-gray-700">
                        {selectedWorker?.full_name}
                      </span>
                      {selectedWorker?.application_status && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          {getStatusBadge(selectedWorker.application_status)}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    ?
                  </div>
                  <div>
                    <h1 className="font-semibold text-gray-900">{job.title}</h1>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                      <p className="text-sm text-gray-500">
                        No workers have applied yet...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Job status */}
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                job.status === "open"
                  ? "bg-green-100 text-green-800"
                  : job.status === "assigned"
                  ? "bg-blue-100 text-blue-800"
                  : job.status === "in_progress"
                  ? "bg-yellow-100 text-yellow-800"
                  : job.status === "completed"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {job.status === "open"
                ? "🔍 Open"
                : job.status === "assigned"
                ? "👤 Assigned"
                : job.status === "in_progress"
                ? "⚙️ In Progress"
                : job.status === "completed"
                ? "✅ Completed"
                : job.status}
            </span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className=" mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-400px">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-500">
                  {workers.length > 0 && selectedWorker
                    ? `Start the conversation with ${selectedWorker.full_name}!`
                    : "Leave a message, workers will see it when they apply"}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMine = message.sender_id === currentUser?.id;
              const isWorkerMessage = !isMine;
              const senderWorker = workers.find(
                (w) => w.id === message.sender_id
              );
              const showAvatar =
                isWorkerMessage &&
                (index === 0 ||
                  messages[index - 1]?.sender_id !== message.sender_id);

              return (
                <div key={message.id}>
                  <div
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[70%] ${
                        isMine ? "flex-row-reverse" : "flex-row"
                      } items-end gap-2`}
                    >
                      {/* Avatar for worker messages */}
                      {!isMine && showAvatar && senderWorker && (
                        <div className="w-12 h-12 rounded-full bg-gray flex items-center justify-center text-white font-bold text-lg">
                          {senderWorker.avatar_url ? (
                            <img
                              src={senderWorker.avatar_url}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                              {senderWorker.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Spacer for alignment */}
                      {!isMine && !showAvatar && (
                        <div className="w-8 h-8 flex-shrink-0" />
                      )}

                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isMine
                            ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-md"
                            : "bg-white border border-gray-200 shadow-sm"
                        }`}
                      >
                        {/* Sender name */}
                        {!isMine && showAvatar && senderWorker && (
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            {senderWorker.full_name}
                          </p>
                        )}

                        {/* Message content */}
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {message.content}
                        </p>

                        {/* Message time */}
                        <p
                          className={`text-xs mt-1.5 ${
                            isMine ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>

                      {/* Avatar for user messages */}
                      {isMine && currentUser && (
                        <div className="w-12 h-12 rounded-full bg-gray flex items-center justify-center text-white font-bold text-lg">
                          {currentUser.avatar_url ? (
                            <img
                              src={currentUser.avatar_url}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-linear-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                              {currentUser.email?.charAt(0).toUpperCase() ||
                                "U"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t shadow-lg">
        <div className="mx-auto p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  workers.length > 0 && selectedWorker
                    ? `Message ${selectedWorker.full_name}...`
                    : "Leave a message for workers who apply..."
                }
                className="w-full p-3 pl-5 pr-12 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
                disabled={sending}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !newMessage.trim() || !selectedWorker}
              className="px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
            >
              {sending ? (
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  <span>Send</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Status message */}
          {workers.length === 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-400 to-blue-500 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-purple-400 to-purple-500 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-pink-400 to-pink-500 border-2 border-white"></div>
              </div>
              <p className="text-sm text-gray-500">
                Your message will be visible to workers when they apply
              </p>
            </div>
          )}

          {workers.length > 1 && selectedWorker && (
            <p className="text-xs text-gray-400 text-center mt-2">
              You're chatting with {workers.length} workers. Click on the avatar
              to switch between conversations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
