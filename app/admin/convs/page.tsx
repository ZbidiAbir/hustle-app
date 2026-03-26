"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Inbox,
  Send,
  Reply,
  Archive,
  Flag,
  Ban,
} from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: "customer" | "worker" | "admin" | null;
  phone?: string | null;
};

type Job = {
  id: string;
  title: string;
  category: string;
  status: string;
};

type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
  job?: Job;
};

type Conversation = {
  job_id: string;
  job_title: string;
  job_category: string;
  job_status: string;
  participants: Profile[];
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
};

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    activeJobs: 0,
    participants: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchTerm, jobFilter, statusFilter]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.job_id);
    }
  }, [selectedConversation]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Récupérer tous les jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, category, status")
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      // 2. Récupérer tous les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(
          `
          id,
          job_id,
          sender_id,
          content,
          read,
          created_at
        `
        )
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      if (!messagesData?.length) {
        setConversations([]);
        return;
      }

      // 3. Récupérer tous les IDs uniques des participants
      const userIds = [...new Set(messagesData.map((m) => m.sender_id))];
      const jobIds = [...new Set(messagesData.map((m) => m.job_id))];

      // 4. Récupérer les profils des participants
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role, phone")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      // 5. Récupérer les jobs concernés
      const jobsMap = new Map(jobsData?.map((j) => [j.id, j]) || []);

      // 6. Grouper les messages par conversation (job_id)
      const conversationsMap = new Map<string, Conversation>();

      messagesData.forEach((message) => {
        const job = jobsMap.get(message.job_id);
        if (!job) return;

        if (!conversationsMap.has(message.job_id)) {
          conversationsMap.set(message.job_id, {
            job_id: message.job_id,
            job_title: job.title,
            job_category: job.category,
            job_status: job.status,
            participants: [],
            unread_count: 0,
            created_at: message.created_at,
            updated_at: message.created_at,
          });
        }

        const conversation = conversationsMap.get(message.job_id)!;

        // Mettre à jour la date du dernier message
        if (new Date(message.created_at) > new Date(conversation.updated_at)) {
          conversation.updated_at = message.created_at;
        }

        // Ajouter le participant s'il n'est pas déjà présent
        const sender = profilesMap.get(message.sender_id);
        if (
          sender &&
          !conversation.participants.some((p) => p.id === sender.id)
        ) {
          conversation.participants.push(sender);
        }

        // Compter les messages non lus
        if (!message.read) {
          conversation.unread_count++;
        }
      });

      // Convertir la Map en tableau et trier par date
      const conversationsArray = Array.from(conversationsMap.values()).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setConversations(conversationsArray);

      // Calculer les statistiques
      const totalUnread = conversationsArray.reduce(
        (sum, c) => sum + c.unread_count,
        0
      );
      const activeJobs = conversationsArray.filter(
        (c) =>
          c.job_status === "open" ||
          c.job_status === "assigned" ||
          c.job_status === "in_progress"
      ).length;
      const uniqueParticipants = new Set(
        conversationsArray.flatMap((c) => c.participants.map((p) => p.id))
      ).size;

      setStats({
        total: conversationsArray.length,
        unread: totalUnread,
        activeJobs,
        participants: uniqueParticipants,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (jobId: string) => {
    try {
      setMessagesLoading(true);

      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          job_id,
          sender_id,
          content,
          read,
          created_at
        `
        )
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Récupérer les profils des expéditeurs
      const senderIds = [...new Set(data?.map((m) => m.sender_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role")
        .in("id", senderIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      const messagesWithSenders = (data || []).map((msg) => ({
        ...msg,
        sender: profilesMap.get(msg.sender_id),
      }));

      setMessages(messagesWithSenders);

      // Marquer les messages comme lus (optionnel pour l'admin)
      // await supabase
      //   .from("messages")
      //   .update({ read: true })
      //   .eq("job_id", jobId)
      //   .eq("read", false);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const filterConversations = () => {
    let filtered = [...conversations];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.job_title?.toLowerCase().includes(term) ||
          conv.job_category?.toLowerCase().includes(term) ||
          conv.participants.some(
            (p) =>
              p.full_name?.toLowerCase().includes(term) ||
              p.email?.toLowerCase().includes(term)
          )
      );
    }

    if (jobFilter !== "all") {
      filtered = filtered.filter((conv) => conv.job_id === jobFilter);
    }

    if (statusFilter === "unread") {
      filtered = filtered.filter((conv) => conv.unread_count > 0);
    } else if (statusFilter === "active") {
      filtered = filtered.filter(
        (conv) =>
          conv.job_status === "open" ||
          conv.job_status === "assigned" ||
          conv.job_status === "in_progress"
      );
    }

    setFilteredConversations(filtered);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} min ago`;
      }
      return `${diffHours} hour ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "worker":
        return "bg-purple-100 text-purple-800";
      case "customer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getJobStatusColor = (status: string) => {
    const colors = {
      open: "bg-emerald-100 text-emerald-800",
      assigned: "bg-blue-100 text-blue-800",
      in_progress: "bg-amber-100 text-amber-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);
  const paginatedConversations = filteredConversations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Message Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage all conversations across jobs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Conversations"
            value={stats.total}
            icon={MessageSquare}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Unread Messages"
            value={stats.unread}
            icon={Inbox}
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            icon={Briefcase}
            color="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            title="Participants"
            value={stats.participants}
            icon={Users}
            color="bg-purple-100 text-purple-600"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title, participant name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition ${
                  showFilters || jobFilter !== "all" || statusFilter !== "all"
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(jobFilter !== "all" || statusFilter !== "all") && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {(jobFilter !== "all" ? 1 : 0) +
                      (statusFilter !== "all" ? 1 : 0)}
                  </span>
                )}
              </button>
              <button
                onClick={fetchData}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Job
                </label>
                <select
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Jobs</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} ({job.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Conversations</option>
                  <option value="unread">Unread Only</option>
                  <option value="active">Active Jobs Only</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Conversations</h2>
              <p className="text-xs text-gray-500 mt-1">
                {filteredConversations.length} total
              </p>
            </div>

            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {paginatedConversations.length > 0 ? (
                paginatedConversations.map((conv) => (
                  <button
                    key={conv.job_id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      selectedConversation?.job_id === conv.job_id
                        ? "bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Job Icon */}
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {conv.job_title}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mb-2 truncate">
                          {conv.job_category}
                        </p>

                        {/* Participants */}
                        <div className="flex items-center gap-1 mb-2">
                          {conv.participants.slice(0, 3).map((participant) => (
                            <div
                              key={participant.id}
                              className={`w-6 h-6 rounded-full ${getAvatarColor(
                                participant.id
                              )} flex items-center justify-center text-white text-xs font-medium ring-2 ring-white`}
                              title={`${participant.full_name} (${participant.role})`}
                            >
                              {participant.avatar_url ? (
                                <img
                                  src={participant.avatar_url}
                                  alt={participant.full_name || ""}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                getInitials(participant.full_name)
                              )}
                            </div>
                          ))}
                          {conv.participants.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{conv.participants.length - 3}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full ${getJobStatusColor(
                              conv.job_status
                            )}`}
                          >
                            {conv.job_status}
                          </span>
                          <span className="text-gray-400">
                            {formatDate(conv.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    No conversations found
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredConversations.length > 0 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <p className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages View */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedConversation.job_title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${getJobStatusColor(
                            selectedConversation.job_status
                          )}`}
                        >
                          {selectedConversation.job_status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {selectedConversation.job_category}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/jobs/${selectedConversation.job_id}`}
                      className="p-2 hover:bg-gray-200 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </Link>
                  </div>

                  {/* Participants */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedConversation.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-gray-200"
                      >
                        <div
                          className={`w-6 h-6 rounded-full ${getAvatarColor(
                            participant.id
                          )} flex items-center justify-center text-white text-xs font-medium`}
                        >
                          {participant.avatar_url ? (
                            <img
                              src={participant.avatar_url}
                              alt={participant.full_name || ""}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(participant.full_name)
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            {participant.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {participant.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messages List */}
                <div className="p-4 h-[500px] overflow-y-auto space-y-4 bg-gray-50/50">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message, index) => {
                      const isAdmin = message.sender?.role === "admin";
                      const prevMessage = messages[index - 1];
                      const showDate =
                        !prevMessage ||
                        new Date(message.created_at).toDateString() !==
                          new Date(prevMessage.created_at).toDateString();

                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                                {new Date(
                                  message.created_at
                                ).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          )}

                          <div
                            className={`flex ${
                              isAdmin ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`flex gap-3 max-w-[80%] ${
                                isAdmin ? "flex-row-reverse" : ""
                              }`}
                            >
                              {/* Avatar */}
                              <div
                                className={`w-8 h-8 rounded-full ${getAvatarColor(
                                  message.sender_id
                                )} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}
                              >
                                {message.sender?.avatar_url ? (
                                  <img
                                    src={message.sender.avatar_url}
                                    alt={message.sender.full_name || ""}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  getInitials(
                                    //@ts-ignore
                                    message?.sender?.full_name
                                  )
                                )}
                              </div>

                              {/* Message Content */}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {message.sender?.full_name || "Unknown"}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                                      message.sender?.role || null
                                    )}`}
                                  >
                                    {message.sender?.role || "user"}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatDate(message.created_at)}
                                  </span>
                                </div>

                                <div
                                  className={`p-3 rounded-lg ${
                                    isAdmin
                                      ? "bg-blue-600 text-white rounded-tr-none"
                                      : "bg-white border border-gray-200 rounded-tl-none"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                  </p>
                                </div>

                                {!message.read &&
                                  message.sender_id !== message.sender?.id && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                      <Clock className="w-3 h-3" />
                                      Delivered
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        No messages in this conversation
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Choose a conversation from the list to view and manage
                  messages
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
