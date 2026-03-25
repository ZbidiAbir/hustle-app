"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Briefcase,
  Zap,
  MessageSquare,
  Edit,
  Archive,
  ChevronRight,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Share2,
  Flag,
  MoreHorizontal,
} from "lucide-react";

import { useToast } from "@/contexts/ToastContext";
import { RateButton } from "../../applications/[id]/components/shared/rate/RateButton";
import { RatingSummary } from "../../applications/[id]/components/shared/rate/RatingSummary";

// Types
type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  fixed_rate?: number;
  min_rate?: number;
  max_rate?: number;
  hourly_rate?: number;
  pay_type: string;
  status: string;
  created_at: string;
  images: string[];
  worker_id: string | null;
  location: string;
  date: string;
  level_required: string;
  urgency: string;
  building_access?: string;
  project_size?: string;
  skills?: string[];
  materials_provided?: boolean;
  coi_url?: string;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  rating?: number | null;
  job_title?: string;
  trade_category?: string;
};

type Application = {
  id: string;
  worker_id: string;
  status: string;
  created_at: string;
  message?: string;
  worker?: Profile;
};

type Conversation = {
  worker: Profile;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

export default function JobDetailPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [assignedWorker, setAssignedWorker] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "details" | "applications" | "messages"
  >("details");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const jobId = params.id as string;

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  // Check if user has rated this job
  const checkIfHasRated = useCallback(async () => {
    if (!jobId || !currentUser?.id) return;

    try {
      const { data: existingRate, error } = await supabase
        .from("rates")
        .select("id")
        .eq("job_id", jobId)
        .eq("reviewer_id", currentUser.id)
        .maybeSingle();

      setHasRated(!!existingRate);
    } catch (error) {
      console.error("Error checking rating status:", error);
      setHasRated(false);
    }
  }, [jobId, currentUser?.id]);

  useEffect(() => {
    if (job && currentUser) {
      checkIfHasRated();
    }
  }, [job, currentUser, checkIfHasRated]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);

      // 1. Récupérer les détails du job
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // 2. Récupérer les applications pour ce job
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;

      let workersList: Profile[] = [];

      if (appsData && appsData.length > 0) {
        // 3. Récupérer les profils des workers
        const workerIds = appsData.map((app) => app.worker_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, avatar_url, rating, job_title, trade_category"
          )
          .in("id", workerIds);

        if (profilesError) throw profilesError;

        // Créer un Map pour un accès facile aux profils
        const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

        // Combiner les applications avec les profils
        const appsWithWorkers = appsData.map((app) => ({
          ...app,
          worker: profilesMap.get(app.worker_id) || {
            id: app.worker_id,
            full_name: "Unknown Worker",
            email: "unknown@email.com",
            avatar_url: null,
            rating: null,
          },
        }));

        setApplications(appsWithWorkers);

        // Collecter tous les workers uniques
        workersList = appsWithWorkers
          .map((app) => app.worker)
          .filter((w): w is Profile => w !== undefined);
      }

      // 4. Si un worker est assigné, récupérer ses détails
      if (jobData.worker_id) {
        const { data: workerData, error: workerError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, avatar_url, rating, job_title, trade_category"
          )
          .eq("id", jobData.worker_id)
          .single();

        if (!workerError && workerData) {
          setAssignedWorker(workerData);

          // S'assurer que le worker assigné est dans la liste des workers
          if (!workersList.some((w) => w.id === workerData.id)) {
            workersList.push(workerData);
          }
        }
      }

      // 5. Récupérer les conversations pour chaque worker
      await fetchConversations(workersList);
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async (workers: Profile[]) => {
    try {
      // Récupérer l'utilisateur courant
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const conversationsList: Conversation[] = [];

      for (const worker of workers) {
        // Récupérer le dernier message entre le customer et ce worker
        const { data: messages, error } = await supabase
          .from("messages")
          .select("*")
          .eq("job_id", jobId)
          .or(`sender_id.eq.${user.id},sender_id.eq.${worker.id}`)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error && messages && messages.length > 0) {
          const lastMessage = messages[0];

          // Compter les messages non lus
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("job_id", jobId)
            .eq("sender_id", worker.id)
            .eq("read", false)
            .neq("sender_id", user.id);

          conversationsList.push({
            worker,
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.created_at,
            unreadCount: unreadCount || 0,
          });
        } else {
          conversationsList.push({
            worker,
            lastMessage: "No messages yet",
            lastMessageTime: "",
            unreadCount: 0,
          });
        }
      }

      conversationsList.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return (
          new Date(b.lastMessageTime).getTime() -
          new Date(a.lastMessageTime).getTime()
        );
      });

      setConversations(conversationsList);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const handleCancelJob = async () => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "cancelled" })
        .eq("id", jobId);

      if (error) throw error;

      toast.success("Job cancelled successfully");
      fetchJobDetails();
      setShowCancelConfirm(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
    setShowShareMenu(false);
  };

  const handleRatingSuccess = () => {
    toast.success("Thank you for your rating!");
    setHasRated(true);
    fetchJobDetails();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const Avatar = ({
    profile,
    size = "md",
  }: {
    profile?: Profile | null;
    size?: "sm" | "md" | "lg";
  }) => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-12 h-12 text-sm",
      lg: "w-16 h-16 text-lg",
    };

    const [imageError, setImageError] = useState(false);

    if (!profile) {
      return (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium`}
        >
          ?
        </div>
      );
    }

    if (profile.avatar_url && !imageError) {
      return (
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden relative bg-gray-100`}
        >
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    const colors = [
      "bg-purple-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    const colorIndex = (profile.id?.charCodeAt(0) || 0) % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <div
        className={`${sizeClasses[size]} rounded-full ${bgColor} flex items-center justify-center text-white font-medium`}
      >
        {getInitials(profile.full_name)}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "🔍",
        text: "Open",
      },
      assigned: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: "👤",
        text: "Assigned",
      },
      in_progress: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "⚙️",
        text: "In Progress",
      },
      completed: {
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: "✅",
        text: "Completed",
      },
      cancelled: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: "❌",
        text: "Cancelled",
      },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}
      >
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            Pending
          </span>
        );
      case "accepted":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatPrice = (job: Job) => {
    switch (job.pay_type) {
      case "Fixed":
        return `$${job.fixed_rate}`;
      case "Range":
        return `$${job.min_rate} - $${job.max_rate}`;
      case "Hourly":
        return `$${job.hourly_rate}/hr`;
      default:
        return "Price TBD";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-purple-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Job Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/customer/dashboard/my-jobs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Back to My Jobs
          </Link>
        </div>
      </div>
    );
  }

  const pendingApplications = applications.filter(
    (a) => a.status === "pending"
  );
  const acceptedApplication = applications.find((a) => a.status === "accepted");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <Link
              href="/customer/dashboard/my-jobs"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Job Details</h1>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusBadge(job.status)}
              <span className="text-sm text-gray-500">
                Posted {formatDateTime(job.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <Share2 className="w-4 h-4 text-gray-600" />
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border z-20">
                    <button
                      onClick={handleShare}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      Copy link
                    </button>
                  </div>
                )}
              </div>

              {job.status === "open" && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition text-rose-600"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-4 border-b">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2 text-sm font-medium transition border-b-2 ${
              activeTab === "details"
                ? "text-purple-600 border-purple-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`pb-2 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
              activeTab === "applications"
                ? "text-purple-600 border-purple-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Applications
            {pendingApplications.length > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                {pendingApplications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`pb-2 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
              activeTab === "messages"
                ? "text-purple-600 border-purple-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Messages
            {conversations.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                {conversations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Assigned Worker Section - Only show if job has assigned worker */}
        {assignedWorker && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="flex items-start gap-4">
              <Avatar profile={assignedWorker} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {assignedWorker.full_name}
                  </h3>
                  {assignedWorker.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {assignedWorker.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {assignedWorker.job_title || "Worker"} •{" "}
                  {assignedWorker.email}
                </p>

                {/* Rating Summary */}
                <div className="mb-3">
                  <RatingSummary
                    userId={assignedWorker.id}
                    showDetails={true}
                  />
                </div>

                {/* Rate Button - Only show if job is completed */}
                {job.status === "completed" && (
                  <div className="mt-3">
                    <RateButton
                      jobId={job.id}
                      workerId={assignedWorker.id}
                      workerName={assignedWorker.full_name}
                      jobTitle={job.title}
                      jobStatus={job.status}
                      hasRated={hasRated}
                      onRatingSuccess={handleRatingSuccess}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {job.title}
              </h2>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(job)}
                </span>
                {job.pay_type === "Fixed" && (
                  <span className="text-sm text-gray-500">fixed price</span>
                )}
              </div>
            </div>

            {/* Location and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium">LOCATION</span>
                </div>
                <p className="font-medium text-gray-900">
                  {job.location || "To be determined"}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">DATE</span>
                </div>
                <p className="font-medium text-gray-900">
                  {job.date ? formatDate(job.date) : "Flexible"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Description
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Category
                </h3>
                <p className="text-gray-600">{job.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Level Required
                </h3>
                <p className="text-gray-600">{job.level_required || "Any"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Urgency
                </h3>
                <p className="text-gray-600 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-gray-400" />
                  {job.urgency || "Flexible"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Project Size
                </h3>
                <p className="text-gray-600">
                  {job.project_size || "Not specified"}
                </p>
              </div>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Skills Required
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Materials & Tools
              </h3>
              <p className="text-gray-600">
                {job.materials_provided
                  ? "I will provide materials"
                  : "Worker should bring materials"}
              </p>
            </div>

            {/* Building Access */}
            {job.building_access && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Building Access
                </h3>
                <p className="text-gray-600">{job.building_access}</p>
              </div>
            )}

            {/* Images */}
            {job.images && job.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Photos
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {job.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Job photo ${i + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* COI Document */}
            {job.coi_url && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  COI Document
                </h3>
                <a
                  href={job.coi_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  <Briefcase className="w-4 h-4" />
                  View Document
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === "applications" && (
          <div className="space-y-4">
            {applications.length > 0 ? (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-3">
                    <Avatar profile={app.worker} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {app.worker?.full_name || "Anonymous"}
                          </h3>
                          {app.worker?.rating && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-600">
                                {app.worker.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        {getApplicationStatusBadge(app.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {app.worker?.email}
                      </p>

                      {app.message && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg mb-2 italic">
                          "{app.message}"
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Applied{" "}
                            {new Date(app.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        {app.status === "pending" && (
                          <Link
                            href={`/customer/dashboard/applications/${app.id}`}
                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition"
                          >
                            Review Application
                          </Link>
                        )}
                        <Link
                          href={`/customer/dashboard/chat/${jobId}?worker=${app.worker_id}`}
                          className="px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No applications yet
                </h3>
                <p className="text-sm text-gray-500">
                  Workers will appear here when they apply to your job
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-4">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <Link
                  key={conversation.worker.id}
                  href={`/customer/dashboard/chat/${jobId}?worker=${conversation.worker.id}`}
                  className="block border border-gray-200 rounded-xl p-4 hover:shadow-md transition hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <Avatar profile={conversation.worker} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {conversation.worker.full_name}
                          </h3>
                          {conversation.worker.rating && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-600">
                                {conversation.worker.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        {conversation.lastMessageTime && (
                          <span className="text-xs text-gray-400">
                            {formatMessageTime(conversation.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        {conversation.worker.email}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {conversation.lastMessage === "No messages yet" ? (
                            <span className="text-gray-400 italic">
                              {conversation.lastMessage}
                            </span>
                          ) : (
                            conversation.lastMessage
                          )}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No conversations yet
                </h3>
                <p className="text-sm text-gray-500">
                  Start a conversation with workers who have applied to your job
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cancel Job?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this job? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelJob}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
              >
                Cancel Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
