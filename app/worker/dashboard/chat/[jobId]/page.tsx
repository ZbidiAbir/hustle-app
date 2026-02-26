"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Loader2,
  ChevronLeft,
  Phone,
  Video,
  Info,
  Check,
  CheckCheck,
  MapPin,
  DollarSign,
  Briefcase,
  MoreVertical,
  Paperclip,
  Smile,
  Image as ImageIcon,
} from "lucide-react";

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
  status: string;
  price: number;
  location: string;
  images?: string[];
};

type Customer = {
  full_name: string;
  email: string;
  avatar_url?: string;
  rating?: number;
  jobs_posted?: number;
  member_since?: string;
};

export default function WorkerChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setCurrentUser(user);

        if (!jobId) {
          setError("Missing job ID");
          return;
        }

        // Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .maybeSingle();

        if (jobError) throw jobError;
        if (!jobData) {
          setError("Job not found");
          return;
        }

        setJob(jobData);

        // Fetch customer info
        const { data: customerData } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", jobData.customer_id)
          .maybeSingle();

        setCustomer({
          ...customerData,
          full_name: customerData?.full_name || "Client",
          email: customerData?.email || "",
          rating: 4.8,
          jobs_posted: 24,
          member_since: new Date(jobData.created_at).toLocaleDateString(
            "en-US",
            {
              month: "long",
              year: "numeric",
            }
          ),
        });

        // Check if user has already applied
        const { data: application } = await supabase
          .from("applications")
          .select("id")
          .eq("job_id", jobId)
          .eq("worker_id", user.id)
          .maybeSingle();

        setHasApplied(!!application);

        // Fetch messages
        await fetchMessages();
      } catch (error) {
        console.error("Error:", error);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) fetchData();
  }, [jobId]);

  // Real-time subscription
  useEffect(() => {
    if (!jobId || !currentUser) return;

    const subscription = supabase
      .channel(`messages:${jobId}`)
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

          let senderName = "Unknown";
          if (newMsg.sender_id === currentUser.id) {
            senderName = "You";
          } else if (customer) {
            senderName = customer.full_name;
          } else {
            const { data: senderData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", newMsg.sender_id)
              .maybeSingle();

            senderName = senderData?.full_name || "Customer";
          }

          setMessages((prev) => [
            ...prev,
            { ...newMsg, sender_name: senderName },
          ]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [jobId, currentUser, customer]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messagesWithNames = await Promise.all(
        (data || []).map(async (msg) => {
          let senderName = "Unknown";

          if (msg.sender_id === currentUser?.id) {
            senderName = "You";
          } else if (customer) {
            senderName = customer.full_name;
          } else {
            const { data: senderData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", msg.sender_id)
              .maybeSingle();

            senderName = senderData?.full_name || "Customer";
          }

          return { ...msg, sender_name: senderName };
        })
      );

      setMessages(messagesWithNames);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [jobId, currentUser, customer]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !job) return;

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
      alert("Error sending message: " + error.message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleApply = async () => {
    try {
      const { error } = await supabase.from("applications").insert([
        {
          job_id: jobId,
          worker_id: currentUser.id,
          message: "",
          status: "pending",
        },
      ]);

      if (error) throw error;
      alert("✅ Application submitted successfully!");
      setHasApplied(true);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "from-purple-500 to-purple-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-red-500 to-red-600",
      "from-yellow-500 to-yellow-600",
      "from-pink-500 to-pink-600",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-red-600 mb-4">{error || "Job not found"}</p>
          <Link
            href="/worker/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/worker/jobs"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </Link>

              {/* Customer Avatar */}
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-r ${getAvatarColor(
                    job.customer_id
                  )} flex items-center justify-center text-white font-bold text-lg shadow-sm`}
                >
                  {customer?.full_name?.charAt(0).toUpperCase() || "C"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Customer Info */}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-gray-900">
                    {customer?.full_name || "Customer"}
                  </h1>
                  {customer?.rating && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 rounded">
                      <span className="text-xs font-medium text-yellow-700">
                        ★
                      </span>
                      <span className="text-xs text-yellow-700">
                        {customer.rating}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Briefcase className="w-3 h-3" />
                  <span className="truncate max-w-[150px]">{job.title}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <DollarSign className="w-3 h-3" />
                  <span>${job.price}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Phone className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Video className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Info className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Job Status Bar */}
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{job.location}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${
                job.status === "open"
                  ? "bg-green-100 text-green-700"
                  : job.status === "assigned"
                  ? "bg-purple-100 text-purple-700"
                  : job.status === "in_progress"
                  ? "bg-yellow-100 text-yellow-700"
                  : job.status === "completed"
                  ? "bg-gray-100 text-gray-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {job.status === "open"
                ? "Open"
                : job.status === "assigned"
                ? "Assigned"
                : job.status === "in_progress"
                ? "In Progress"
                : job.status === "completed"
                ? "Completed"
                : job.status}
            </span>
            {!hasApplied && job.status === "open" && (
              <button
                onClick={handleApply}
                className="ml-auto px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-purple-500"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No messages yet
                </h3>
                <p className="text-sm text-gray-500">
                  Start the conversation with{" "}
                  {customer?.full_name || "the customer"}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMine = message.sender_id === currentUser?.id;
              const showAvatar =
                !isMine &&
                (index === 0 ||
                  messages[index - 1]?.sender_id !== message.sender_id);

              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[70%] ${
                      isMine ? "flex-row-reverse" : "flex-row"
                    } items-end gap-2`}
                  >
                    {/* Avatar for other user */}
                    {!isMine && showAvatar && (
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-r ${getAvatarColor(
                          job.customer_id
                        )} flex-shrink-0 flex items-center justify-center text-white text-xs font-medium shadow-sm`}
                      >
                        {customer?.full_name?.charAt(0).toUpperCase() || "C"}
                      </div>
                    )}
                    {!isMine && !showAvatar && (
                      <div className="w-8 h-8 flex-shrink-0" />
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isMine
                          ? "bg-purple-600 text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      {!isMine && showAvatar && (
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          {customer?.full_name || "Customer"}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                          isMine ? "text-purple-200" : "text-gray-400"
                        }`}
                      >
                        <span>{formatTime(message.created_at)}</span>
                        {isMine && (
                          <span>
                            {message.read ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* My Avatar */}
                    {isMine && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                        {currentUser?.email?.charAt(0).toUpperCase() || "M"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-2">
            Press Enter to send • Be respectful and professional
          </p>
        </div>
      </div>
    </div>
  );
}
