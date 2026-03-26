"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Star,
  Award,
  Shield,
  AlertCircle,
  Download,
  Send,
  ChevronLeft,
  Building2,
  Home,
  BadgeCheck,
  Hourglass,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

type Application = {
  id: string;
  job_id: string;
  worker_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at?: string;
  job?: {
    id: string;
    title: string;
    description: string;
    category: string;
    price?: number;
    fixed_rate?: number;
    min_rate?: number;
    max_rate?: number;
    hourly_rate?: number;
    pay_type?: string;
    location: string;
    status: string;
    created_at: string;
    customer_id: string;
    images?: string[];
    skills?: string[];
    level_required?: string;
    project_size?: string;
    urgency?: string;
    date?: string;
    time_slot?: string;
    customer?: {
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
      phone?: string;
      account_type?: "homeowner" | "smallbusiness";
      company_name?: string;
      business_verified?: boolean;
    };
  };
  worker?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
    job_title?: string;
    trade_category?: string;
    skills?: string[];
    level?: string;
    hourly_rate?: number;
    rate_type?: string;
    business_verified?: boolean;
    insurance_verified?: boolean;
    loyalty_points?: number;
    rating?: number;
    jobs_completed?: number;
    created_at?: string;
    address?: string;
    city?: string;
  };
};

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  sender?: {
    full_name: string;
    avatar_url?: string;
    role?: string;
  };
};

export default function AdminApplicationDetailPage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "messages" | "worker" | "job"
  >("details");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    "accept" | "reject" | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;

  useEffect(() => {
    if (
      !applicationId ||
      applicationId === "undefined" ||
      applicationId === "null"
    ) {
      setError("Application ID is missing or invalid");
      setLoading(false);
      return;
    }

    fetchApplicationDetails();
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer l'application
      const { data: appData, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (appError) {
        if (appError.code === "PGRST116") {
          setError("Application not found");
        } else {
          throw appError;
        }
        return;
      }

      // 2. Récupérer les détails du job
      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", appData.job_id)
        .single();

      // 3. Récupérer le client (propriétaire du job)
      let customerData = null;
      if (jobData?.customer_id) {
        const { data } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, avatar_url, phone, account_type, company_name, business_verified"
          )
          .eq("id", jobData.customer_id)
          .single();
        customerData = data;
      }

      // 4. Récupérer les détails du worker
      const { data: workerData } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          email,
          avatar_url,
          phone,
          job_title,
          trade_category,
          skills,
          level,
          hourly_rate,
          rate_type,
          business_verified,
          insurance_verified,
          loyalty_points,
          address,
          city,
          created_at
        `
        )
        .eq("id", appData.worker_id)
        .single();

      // 5. Récupérer les statistiques du worker
      let workerStats = {
        rating: 0,
        jobs_completed: 0,
      };

      if (workerData) {
        // Jobs complétés
        const { count: completedCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("worker_id", workerData.id)
          .eq("status", "completed");

        // Notes moyennes
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("worker_id", workerData.id);

        const avgRating = reviews?.length
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        workerStats = {
          jobs_completed: completedCount || 0,
          rating: avgRating,
        };
      }

      setApplication({
        ...appData,
        job: jobData
          ? {
              ...jobData,
              customer: customerData,
            }
          : undefined,
        worker: workerData
          ? {
              ...workerData,
              ...workerStats,
            }
          : undefined,
      });

      // 6. Récupérer les messages pour cette conversation
      await fetchMessages(appData.job_id, appData.worker_id);
    } catch (err: any) {
      console.error("Error fetching application details:", err);
      setError(err.message || "Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (jobId: string, workerId: string) => {
    try {
      setMessagesLoading(true);

      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          content,
          sender_id,
          created_at,
          read
        `
        )
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Récupérer les profils des expéditeurs
      const senderIds = [...new Set(data?.map((m) => m.sender_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .in("id", senderIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      const messagesWithSenders = (data || []).map((msg) => ({
        ...msg,
        sender: profilesMap.get(msg.sender_id),
      }));

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!application) return;

    try {
      setStatusChanging(true);

      // Mettre à jour le statut de l'application
      const { error: appError } = await supabase
        .from("applications")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (appError) throw appError;

      // Mettre à jour le job (assigner le worker)
      const { error: jobError } = await supabase
        .from("jobs")
        .update({
          status: "assigned",
          worker_id: application.worker_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.job_id);

      if (jobError) throw jobError;

      // Mettre à jour l'état local
      setApplication({
        ...application,
        status: "accepted",
        updated_at: new Date().toISOString(),
        job: application.job
          ? {
              ...application.job,
              status: "assigned",
              //@ts-ignore
              worker_id: application.worker_id,
            }
          : undefined,
      });

      setShowStatusModal(false);
      setSelectedAction(null);

      // Afficher un message de succès
      alert(
        "Application accepted successfully! Job has been assigned to the worker."
      );
    } catch (error) {
      console.error("Error accepting application:", error);
      alert("Failed to accept application. Please try again.");
    } finally {
      setStatusChanging(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;

    try {
      setStatusChanging(true);

      const updates: any = {
        status: "rejected",
        updated_at: new Date().toISOString(),
      };

      if (rejectionReason) {
        updates.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from("applications")
        .update(updates)
        .eq("id", application.id);

      if (error) throw error;

      // Mettre à jour l'état local
      setApplication({
        ...application,
        status: "rejected",
        updated_at: new Date().toISOString(),
      });

      setShowStatusModal(false);
      setSelectedAction(null);
      setRejectionReason("");

      alert("Application rejected successfully.");
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Failed to reject application. Please try again.");
    } finally {
      setStatusChanging(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !application) return;

    try {
      setSendingMessage(true);

      const { data: userData } = await supabase.auth.getUser();
      const adminId = userData.user?.id;

      const { error } = await supabase.from("messages").insert({
        job_id: application.job_id,
        sender_id: adminId,
        content: newMessage.trim(),
        read: false,
      });

      if (error) throw error;

      // Rafraîchir les messages
      await fetchMessages(application.job_id, application.worker_id);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatPrice = (job: Application["job"]) => {
    if (!job) return "$0";

    switch (job.pay_type) {
      case "Fixed":
        return job.fixed_rate
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            }).format(job.fixed_rate)
          : "$0";
      case "Range":
        if (job.min_rate && job.max_rate) {
          return `${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          }).format(job.min_rate)} - ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          }).format(job.max_rate)}`;
        }
        return "$0";
      case "Hourly":
        return job.hourly_rate
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            }).format(job.hourly_rate) + "/hr"
          : "$0";
      default:
        return job.price
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            }).format(job.price)
          : "$0";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
      }
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Hourglass,
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        iconColor: "text-amber-500",
        label: "Pending Review",
      },
      accepted: {
        icon: CheckCircle,
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        iconColor: "text-emerald-500",
        label: "Accepted",
      },
      rejected: {
        icon: XCircle,
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        iconColor: "text-rose-500",
        label: "Rejected",
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full p-6 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error || "Application Not Found"}
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            {error || "The application you're looking for doesn't exist."}
          </p>
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(application.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/applications"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Application Review
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  ID: {application.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                <StatusIcon className={`w-4 h-4 ${statusConfig.iconColor}`} />
                {statusConfig.label}
              </span>
              {/* <button
                onClick={() => setShowStatusModal(true)}
                disabled={statusChanging}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Edit className="w-4 h-4" />
                Update Status
              </button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                activeTab === "details"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Application Details
            </button>
            <button
              onClick={() => setActiveTab("worker")}
              className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                activeTab === "worker"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Worker Profile
            </button>
            <button
              onClick={() => setActiveTab("job")}
              className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                activeTab === "job"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Job Details
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                activeTab === "messages"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Messages ({messages.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Application Details Tab */}
              {activeTab === "details" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Application Message
                  </h2>

                  {application.message ? (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {application.message}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic mb-6">
                      No message provided
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Applied Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(application.created_at)}
                      </p>
                    </div>
                    {application.updated_at && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">
                          Last Updated
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatDate(application.updated_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  {/* <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {application.status !== "accepted" && (
                        <button
                          onClick={() => {
                            setSelectedAction("accept");
                            setShowStatusModal(true);
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Accept Application
                        </button>
                      )}
                      {application.status !== "rejected" && (
                        <button
                          onClick={() => {
                            setSelectedAction("reject");
                            setShowStatusModal(true);
                          }}
                          className="px-4 py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition flex items-center gap-2"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          Reject Application
                        </button>
                      )}
                    </div>
                  </div> */}
                </div>
              )}

              {/* Worker Profile Tab */}
              {activeTab === "worker" && application.worker && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-full ${getAvatarColor(
                          application.worker.id
                        )} flex items-center justify-center text-white text-xl font-bold`}
                      >
                        {application.worker.avatar_url ? (
                          <img
                            src={application.worker.avatar_url}
                            alt={application.worker.full_name || ""}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(application.worker.full_name)
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {application.worker.full_name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {application.worker.job_title ||
                            application.worker.trade_category ||
                            "Worker"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {application.worker.business_verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                              <BadgeCheck className="w-3 h-3" />
                              Verified Business
                            </span>
                          )}
                          {application.worker.insurance_verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              <Shield className="w-3 h-3" />
                              Insured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/admin/users/${application.worker.id}`}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <Star className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        {application.worker.rating?.toFixed(1) || "0.0"}
                      </p>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <Briefcase className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        {application.worker.jobs_completed || 0}
                      </p>
                      <p className="text-xs text-gray-500">Jobs Completed</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <Award className="w-5 h-5 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        {application.worker.loyalty_points || 0}
                      </p>
                      <p className="text-xs text-gray-500">Loyalty Points</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a
                          href={`mailto:${application.worker.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {application.worker.email}
                        </a>
                      </div>
                      {application.worker.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a
                            href={`tel:${application.worker.phone}`}
                            className="text-gray-900"
                          >
                            {application.worker.phone}
                          </a>
                        </div>
                      )}
                      {application.worker.city && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {application.worker.city}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          Member since{" "}
                          {formatRelativeDate(
                            application.worker.created_at || ""
                          )}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-medium text-gray-900 pt-4">
                      Professional Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {application.worker.level && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Level</p>
                          <p className="font-medium text-gray-900">
                            {application.worker.level}
                          </p>
                        </div>
                      )}
                      {application.worker.hourly_rate && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">
                            Hourly Rate
                          </p>
                          <p className="font-medium text-gray-900">
                            ${application.worker.hourly_rate}/
                            {application.worker.rate_type || "hr"}
                          </p>
                        </div>
                      )}
                    </div>

                    {application.worker.skills &&
                      application.worker.skills.length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3">
                            Skills
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {application.worker.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Job Details Tab */}
              {activeTab === "job" && application.job && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {application.job.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {application.job.category}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            application.job.status === "open"
                              ? "bg-emerald-100 text-emerald-800"
                              : application.job.status === "assigned"
                              ? "bg-blue-100 text-blue-800"
                              : application.job.status === "in_progress"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {application.job.status}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/jobs/${application.job.id}`}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(application.job)}
                      </p>
                      {application.job.pay_type && (
                        <p className="text-xs text-gray-500 mt-1">
                          {application.job.pay_type}
                        </p>
                      )}
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {application.job.location}
                      </p>
                    </div>
                  </div>

                  {/* Client Info */}
                  {application.job.customer && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Client</h3>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${getAvatarColor(
                            application.job.customer.id
                          )} flex items-center justify-center text-white font-medium`}
                        >
                          {application.job.customer.avatar_url ? (
                            <img
                              src={application.job.customer.avatar_url}
                              alt={application.job.customer.full_name || ""}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(application.job.customer.full_name)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {application.job.customer.full_name}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            {application.job.customer.account_type ===
                            "smallbusiness" ? (
                              <>
                                <Building2 className="w-3 h-3" />
                                <span>Small Business</span>
                              </>
                            ) : (
                              <>
                                <Home className="w-3 h-3" />
                                <span>Homeowner</span>
                              </>
                            )}
                            {application.job.customer.business_verified && (
                              <span className="ml-2 text-emerald-600 flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {application.job.description && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 mb-3">
                        Description
                      </h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {application.job.description}
                      </p>
                    </div>
                  )}

                  {/* Job Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {application.job.project_size && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">
                          Project Size
                        </p>
                        <p className="font-medium text-gray-900">
                          {application.job.project_size}
                        </p>
                      </div>
                    )}
                    {application.job.urgency && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Urgency</p>
                        <p className="font-medium text-gray-900">
                          {application.job.urgency}
                        </p>
                      </div>
                    )}
                    {application.job.date && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">
                          Preferred Date
                        </p>
                        <p className="font-medium text-gray-900">
                          {new Date(application.job.date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {application.job.time_slot && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Time Slot</p>
                        <p className="font-medium text-gray-900">
                          {application.job.time_slot}
                        </p>
                      </div>
                    )}
                    {application.job.level_required && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">
                          Level Required
                        </p>
                        <p className="font-medium text-gray-900">
                          {application.job.level_required}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Skills Required */}
                  {application.job.skills &&
                    application.job.skills.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-medium text-gray-900 mb-3">
                          Skills Required
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {application.job.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === "messages" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-gray-900">
                      Conversation
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {messages.length} messages in this thread
                    </p>
                  </div>

                  <div className="p-4 h-[500px] overflow-y-auto space-y-4">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((message, index) => {
                        const isAdmin = message.sender?.role === "admin";
                        const isWorker =
                          message.sender_id === application.worker_id;
                        const isCustomer =
                          message.sender_id === application.job?.customer_id;

                        let senderName = "Unknown";
                        if (isAdmin) senderName = "Admin";
                        else if (isWorker)
                          senderName =
                            application.worker?.full_name || "Worker";
                        else if (isCustomer)
                          senderName =
                            application.job?.customer?.full_name || "Customer";

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isAdmin ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`flex gap-3 max-w-[80%] ${
                                isAdmin ? "flex-row-reverse" : ""
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full ${getAvatarColor(
                                  message.sender_id
                                )} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}
                              >
                                {message.sender?.avatar_url ? (
                                  <img
                                    src={message.sender.avatar_url}
                                    alt={senderName}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  getInitials(senderName)
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {senderName}
                                  </span>
                                  {isAdmin && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                                      Admin
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {formatRelativeDate(message.created_at)}
                                  </span>
                                </div>
                                <div
                                  className={`p-3 rounded-lg ${
                                    isAdmin
                                      ? "bg-blue-600 text-white rounded-tr-none"
                                      : "bg-gray-100 text-gray-900 rounded-tl-none"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No messages yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      Application ID
                    </span>
                    <span className="text-sm font-mono text-gray-900">
                      {application.id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Submitted</span>
                    <span className="text-sm text-gray-900">
                      {formatRelativeDate(application.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Job Status</span>
                    <span
                      className={`text-sm capitalize ${
                        application.job?.status === "open"
                          ? "text-emerald-600"
                          : application.job?.status === "assigned"
                          ? "text-blue-600"
                          : application.job?.status === "in_progress"
                          ? "text-amber-600"
                          : "text-gray-600"
                      }`}
                    >
                      {application.job?.status?.replace("_", " ") || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Worker Card */}
              {application.worker && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Worker</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-full ${getAvatarColor(
                        application.worker.id
                      )} flex items-center justify-center text-white font-bold`}
                    >
                      {application.worker.avatar_url ? (
                        <img
                          src={application.worker.avatar_url}
                          alt={application.worker.full_name || ""}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(application.worker.full_name)
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {application.worker.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {application.worker.job_title ||
                          application.worker.trade_category ||
                          "Worker"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${application.worker.email}`}
                        className="text-blue-600 hover:underline truncate"
                      >
                        {application.worker.email}
                      </a>
                    </div>
                    {application.worker.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a
                          href={`tel:${application.worker.phone}`}
                          className="text-gray-900"
                        >
                          {application.worker.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/admin/users/${application.worker.id}`}
                    className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Profile
                  </Link>
                </div>
              )}

              {/* Job Card */}
              {application.job && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Job</h3>
                  <p className="font-medium text-gray-900 mb-2">
                    {application.job.title}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {application.job.category}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {formatPrice(application.job)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {application.job.location}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/jobs/${application.job.id}`}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Job Details
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {selectedAction === "accept"
                ? "Accept Application"
                : "Reject Application"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {selectedAction === "accept"
                ? "This will accept the application and assign the worker to the job."
                : "Are you sure you want to reject this application?"}
            </p>

            {selectedAction === "reject" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection (optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedAction(null);
                  setRejectionReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              {selectedAction === "accept" && (
                <button
                  onClick={handleAccept}
                  disabled={statusChanging}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {statusChanging ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Accept
                    </>
                  )}
                </button>
              )}

              {selectedAction === "reject" && (
                <button
                  onClick={handleReject}
                  disabled={statusChanging}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {statusChanging ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Confirm Reject
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
