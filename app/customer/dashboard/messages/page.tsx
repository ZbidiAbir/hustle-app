"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  Paperclip,
  Smile,
  Send,
  Users,
  MessageSquare,
  Briefcase,
  MapPin,
  Calendar,
} from "lucide-react";

type Conversation = {
  id: string; // job_id
  jobTitle: string;
  otherUser: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    role: "worker" | "customer";
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
  date?: string;
};

type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedConversation) return;

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
            newMsg.sender_id === selectedConversation.otherUser.id
              ? selectedConversation.otherUser
              : { full_name: "You", avatar_url: undefined };

          setMessages((prev) => [
            ...prev,
            {
              ...newMsg,
              sender_name: sender.full_name,
              sender_avatar: sender.avatar_url,
            },
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

  const fetchConversations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get all jobs where user is involved (as customer or worker)
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select(
          "id, title, status, price, location, date, customer_id, worker_id"
        )
        .or(`customer_id.eq.${user.id},worker_id.eq.${user.id}`)
        .not("worker_id", "is", null) // Only jobs with assigned worker
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      if (!jobsData || jobsData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 2. For each job, get the other participant and last message
      const conversationsData = await Promise.all(
        jobsData.map(async (job) => {
          const otherUserId =
            job.customer_id === user.id ? job.worker_id : job.customer_id;

          // Get other user profile
          const { data: otherUserData } = await supabase
            .from("profiles")
            .select("full_name, email, avatar_url")
            .eq("id", otherUserId)
            .single();

          // Get last message
          const { data: lastMsgData } = await supabase
            .from("messages")
            .select("*")
            .eq("job_id", job.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

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
            otherUser: {
              id: otherUserId,
              full_name: otherUserData?.full_name || "Unknown",
              email: otherUserData?.email || "",
              avatar_url: otherUserData?.avatar_url,
              role: job.customer_id === user.id ? "worker" : "customer",
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
            date: job.date,
          };
        })
      );
      //@ts-ignore
      setConversations(conversationsData);

      // Auto-select first conversation if none selected
      if (!selectedConversation && conversationsData.length > 0) {
        //@ts-ignore

        handleSelectConversation(conversationsData[0]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Add sender names
      const messagesWithSenders = data.map((msg) => {
        const isMine = msg.sender_id === currentUser?.id;
        const sender = isMine
          ? { full_name: "You", avatar_url: undefined }
          : selectedConversation?.otherUser;
        return {
          ...msg,
          sender_name: sender?.full_name,
          sender_avatar: sender?.avatar_url,
        };
      });

      setMessages(messagesWithSenders);

      // Mark all messages from other user as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("job_id", jobId)
        .neq("sender_id", currentUser?.id);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileList(false);
    await fetchMessages(conversation.id);

    // Update unread count in conversation list
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const sendMessage = async (e: React.FormEvent) => {
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
  };

  const formatMessageTime = (dateString: string) => {
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
  };

  const formatConversationTime = (dateString?: string) => {
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
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.otherUser.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-gradient-to-br from-purple-500 to-pink-500",
      "bg-gradient-to-br from-blue-500 to-cyan-500",
      "bg-gradient-to-br from-green-500 to-emerald-500",
      "bg-gradient-to-br from-yellow-500 to-amber-500",
      "bg-gradient-to-br from-red-500 to-rose-500",
      "bg-gradient-to-br from-indigo-500 to-violet-500",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-purple-600"></div>
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
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <div className="relative mt-4">
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
                    className={`w-12 h-12 rounded-full ${getAvatarColor(
                      conv.otherUser.id
                    )} flex items-center justify-center text-white font-bold text-lg`}
                  >
                    {conv.otherUser.full_name.charAt(0).toUpperCase()}
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
                <div className="flex-1 min-w-0">
                  <div className="flex  justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {conv.otherUser.full_name}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatConversationTime(conv.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-purple-500 truncate mb-1">
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
                When you have active jobs with workers, they'll appear here
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
                  className={`w-10 h-10 rounded-full ${getAvatarColor(
                    selectedConversation.otherUser.id
                  )} flex items-center justify-center text-white font-bold`}
                >
                  {selectedConversation.otherUser.full_name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                {/* Info */}
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.otherUser.full_name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {selectedConversation.otherUser.role === "worker"
                        ? "Worker"
                        : "Customer"}
                    </span>
                    <span>•</span>
                    <span>{selectedConversation.jobTitle}</span>
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
              <div className="flex items-center gap-1 text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span>${selectedConversation.price}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{selectedConversation.location}</span>
              </div>
              {selectedConversation.date && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(selectedConversation.date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <span
                className={`ml-auto text-xs px-2 py-1 rounded-full ${
                  selectedConversation.status === "assigned"
                    ? "bg-blue-100 text-blue-700"
                    : selectedConversation.status === "in_progress"
                    ? "bg-amber-100 text-amber-700"
                    : selectedConversation.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {selectedConversation.status}
              </span>
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
                          className={`w-8 h-8 rounded-full ${getAvatarColor(
                            selectedConversation.otherUser.id
                          )} flex-shrink-0 flex items-center justify-center text-white text-xs font-medium`}
                        >
                          {selectedConversation.otherUser.full_name
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
                            {selectedConversation.otherUser.full_name}
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-medium">
                          {currentUser?.email?.charAt(0).toUpperCase()}
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
                  <Send className="w-5 h-5" />
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
