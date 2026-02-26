"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  ChevronLeft,
  Send,
  MoreVertical,
  Phone,
  Video,
  Info,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  User,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Star,
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

type Conversation = {
  id: string; // job_id
  jobTitle: string;
  customer: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    rating?: number;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
  unreadCount: number;
  status: string;
  price: number;
  location: string;
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
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  rating?: number;
  jobs_posted?: number;
};

export default function WorkerChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  // Initialize: fetch user and conversations
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      await fetchConversations();
    };
    init();
  }, []);

  // If jobId is provided in URL, select that conversation
  useEffect(() => {
    if (jobId && conversations.length > 0) {
      const conversation = conversations.find((c) => c.id === jobId);
      if (conversation) {
        handleSelectConversation(conversation);
      }
    }
  }, [jobId, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Subscribe to new messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !currentUser) return;

    const subscription = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `job_id=eq.${selectedConversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          // Mark as read if it's from the other user
          if (newMsg.sender_id !== currentUser?.id) {
            await supabase
              .from("messages")
              .update({ read: true })
              .eq("id", newMsg.id);
          }

          // Add sender info
          const sender =
            newMsg.sender_id === selectedConversation.customer.id
              ? selectedConversation.customer
              : { full_name: "You", avatar_url: undefined };

          setMessages((prev) => [
            ...prev,
            { ...newMsg, sender_name: sender.full_name },
          ]);

          // Update conversation list
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedConversation, currentUser]);

  const fetchConversations = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get all jobs where user is involved (as worker)
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, status, price, location, customer_id")
        .eq("worker_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      if (!jobsData || jobsData.length === 0) {
        setConversations([]);
        return;
      }

      // Get customer profiles
      const customerIds = jobsData.map((job) => job.customer_id);
      const { data: customersData } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", customerIds);

      const customersMap = new Map(customersData?.map((c) => [c.id, c]) || []);

      // Build conversations with last message and unread count
      const conversationsData = await Promise.all(
        jobsData.map(async (job) => {
          const customer = customersMap.get(job.customer_id);

          // Get last message
          const { data: lastMsgData } = await supabase
            .from("messages")
            .select("*")
            .eq("job_id", job.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Count unread messages
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id)
            .eq("read", false)
            .neq("sender_id", user.id);

          return {
            id: job.id,
            jobTitle: job.title,
            customer: {
              id: job.customer_id,
              full_name: customer?.full_name || "Client",
              email: customer?.email || "",
              avatar_url: customer?.avatar_url,
              rating: 4.8, // Would come from reviews table
            },
            lastMessage: lastMsgData
              ? {
                  content: lastMsgData.content,
                  created_at: lastMsgData.created_at,
                  sender_id: lastMsgData.sender_id,
                  read: lastMsgData.read,
                }
              : undefined,
            unreadCount: count || 0,
            status: job.status,
            price: job.price,
            location: job.location,
          };
        })
      );

      setConversations(conversationsData);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("job_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Add sender names
        const messagesWithNames = data.map((msg) => {
          const isMine = msg.sender_id === currentUser?.id;
          const sender = isMine
            ? "You"
            : selectedConversation?.customer.full_name || "Customer";
          return { ...msg, sender_name: sender };
        });

        setMessages(messagesWithNames);

        // Mark all messages from customer as read
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("job_id", conversationId)
          .neq("sender_id", currentUser?.id);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },
    [currentUser, selectedConversation]
  );

  const handleSelectConversation = useCallback(
    async (conversation: Conversation) => {
      setSelectedConversation(conversation);
      setShowMobileList(false);
      await fetchMessages(conversation.id);

      // Update URL without reload

      // Update unread count in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, unreadCount: 0 } : c
        )
      );
    },
    [fetchMessages, router]
  );

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedConversation || !currentUser) return;

      setSending(true);
      try {
        const { error } = await supabase.from("messages").insert([
          {
            job_id: selectedConversation.id,
            sender_id: currentUser.id,
            content: newMessage.trim(),
            read: false,
          },
        ]);

        if (error) throw error;
        setNewMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setSending(false);
      }
    },
    [newMessage, selectedConversation, currentUser]
  );

  const formatMessageTime = useCallback((dateString: string) => {
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
  }, []);

  const formatConversationTime = useCallback((dateString?: string) => {
    if (!dateString) return "";
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
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }, []);

  const filteredConversations = useMemo(() => {
    return conversations.filter(
      (conv) =>
        conv.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.customer.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  const getAvatarColor = useCallback((id: string) => {
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Conversations Sidebar */}
      <div
        className={`${
          showMobileList ? "flex" : "hidden"
        } md:flex w-full md:w-80 lg:w-96 flex-col border-r border-gray-200 bg-white absolute md:relative z-10 h-full`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <button
              onClick={() => fetchConversations(true)}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              <Loader2
                className={`w-4 h-4 text-gray-600 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition border-b border-gray-100 ${
                  selectedConversation?.id === conv.id ? "bg-purple-50" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full bg-linear-to-r ${getAvatarColor(
                      conv.customer.id
                    )} flex items-center justify-center text-white font-bold text-lg`}
                  >
                    {conv.customer.full_name.charAt(0).toUpperCase()}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {conv.unreadCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {conv.customer.full_name}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatConversationTime(conv.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate mb-1">
                    Job Title: {conv.jobTitle}
                  </p>
                  {conv.lastMessage && (
                    <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                      {conv.lastMessage.sender_id === currentUser?.id && (
                        <span className="text-purple-600">You: </span>
                      )}
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No conversations yet
              </h3>
              <p className="text-xs text-gray-500">
                When you're assigned to jobs, they'll appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`${
          !showMobileList ? "flex" : "hidden"
        } md:flex flex-1 flex-col bg-gray-50`}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full bg-linear-to-r ${getAvatarColor(
                    selectedConversation.customer.id
                  )} flex items-center justify-center text-white font-bold`}
                >
                  {selectedConversation.customer.full_name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.customer.full_name}
                    </h2>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-600">
                        {selectedConversation.customer.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Briefcase className="w-3 h-3" />
                    <span>{selectedConversation.jobTitle}</span>
                    <span>•</span>
                    <DollarSign className="w-3 h-3" />
                    <span>${selectedConversation.price}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Info className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Job Info Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 text-sm">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedConversation.status === "assigned"
                    ? "bg-purple-100 text-purple-700"
                    : selectedConversation.status === "in_progress"
                    ? "bg-yellow-100 text-yellow-700"
                    : selectedConversation.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {selectedConversation.status}
              </span>
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{selectedConversation.location}</span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const isMine = message.sender_id === currentUser?.id;
                const showAvatar =
                  !isMine &&
                  (index === 0 ||
                    messages[index - 1]?.sender_id !== message.sender_id);

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[70%] ${
                        isMine ? "flex-row-reverse" : "flex-row"
                      } items-end gap-2`}
                    >
                      {/* Avatar */}
                      {!isMine && showAvatar && (
                        <div
                          className={`w-8 h-8 rounded-full bg-linear-to-r ${getAvatarColor(
                            selectedConversation.customer.id
                          )} flex-shrink-0 flex items-center justify-center text-white text-xs font-medium`}
                        >
                          {selectedConversation.customer.full_name
                            .charAt(0)
                            .toUpperCase()}
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
                            {selectedConversation.customer.full_name}
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
                          <span>{formatMessageTime(message.created_at)}</span>
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
                        <div className="w-8 h-8 rounded-full bg-linear-to-r from-green-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-medium">
                          {currentUser?.email?.charAt(0).toUpperCase() || "M"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          // No conversation selected
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your Messages
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Select a conversation from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
