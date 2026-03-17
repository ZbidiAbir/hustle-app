"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  // Navigation & Actions
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Share2,
  Heart,
  Bookmark,
  Flag,
  Printer,
  Download,
  Send,

  // Communication
  MessageSquare,
  MessageCircle,
  Phone,
  PhoneCall,
  Video,
  Mail,

  // Job Related
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Clock3,
  CalendarIcon,
  MapPinned,
  BriefcaseIcon,
  Tag,
  FileText,

  // Profile & Ratings
  User,
  Users,
  UserCircle,
  Star,
  Award,
  AwardIcon,
  ThumbsUp,
  ThumbsDown,
  BadgeCheck,
  Shield,
  ShieldCheck,
  ShieldCheckIcon,
  BadgeCheckIcon,

  // Trade Categories
  Wrench,
  Hammer,
  Paintbrush,
  Zap,
  Droplets,
  Thermometer,
  TreePine,
  Sparkles,
  Truck,
  Ruler,
  PenTool,
  Grid3x3,

  // Status & Alerts
  CheckCircle,
  CheckCircle2,
  XCircle,
  XCircle as XCircleIcon,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,

  // Payment & Documents
  CreditCard,
  Landmark,
  File,
  FileText as FileTextIcon,
  Paperclip,
  Copy,
  Check,

  // Time & Schedule
  Clock as ClockIcon,
  Clock3 as Clock3Icon,

  // Location
  MapPin as MapPinIcon,
  MapPinned as MapPinnedIcon,

  // Misc
  Home,
  Store,
  HardHat,
  Trash2,
  ExternalLink,
  Link as LinkIcon,
  Settings,
  LogOut,
  Bell,
  BellRing,
  BellOff,
  Moon,
  Sun,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit,
  Trash,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Menu,
  X,
} from "lucide-react";
import {
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyJobStatusChanged,
} from "@/lib/notifications";
import { useToast } from "@/contexts/ToastContext";

// ============== Types ==============
type Application = {
  id: string;
  job_id: string;
  worker_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  job?: Job;
  worker?: WorkerProfile;
};

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  status: string;
  created_at: string;
  start_date?: string;
  end_date?: string;
  requirements?: string[];
  images?: string[];
};

type WorkerProfile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  zip_code?: string;
  job_title?: string;
  trade_category?: string;
  level?: "beginner" | "intermediate" | "expert" | "master" | null;
  skills?: string[];
  rate_type?: "hourly" | "fixed" | "project" | null;
  hourly_rate?: number;
  bank_name?: string;
  bank_account_holder?: string;
  bank_account_number?: string;
  bank_routing_number?: string;
  insurance_url?: string;
  insurance_verified?: boolean;
  rating?: number;
  reviews_count?: number;
  jobs_completed?: number;
  verified?: boolean;
  created_at: string;
};

// ============== Main Component ==============
export default function ApplicationDetailPage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [completedJobsCount, setCompletedJobsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"proposal" | "job" | "worker">(
    "proposal"
  );
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const applicationId = params.id as string;

  // ============== Effects ==============
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
    fetchApplicationDetails();
  }, [applicationId]);

  // ============== Data Fetching ==============
  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);

      // 1. Get application
      const { data: appData, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (appError) throw appError;

      // 2. Get job details
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", appData.job_id)
        .single();

      if (jobError) throw jobError;

      // 3. Get worker details
      const { data: workerData, error: workerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", appData.worker_id)
        .single();

      if (workerError) throw workerError;

      // 4. Count completed jobs
      const { count, error: countError } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("worker_id", appData.worker_id)
        .eq("status", "completed");

      if (countError) throw countError;

      setCompletedJobsCount(count || 0);
      setApplication({
        ...appData,
        job: jobData,
        worker: workerData,
      });
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  // ============== Actions ==============
  const handleAccept = async () => {
    if (!application) return;

    setProcessing(true);
    try {
      // Accept this application
      const { error: acceptError } = await supabase
        .from("applications")
        .update({ status: "accepted" })
        .eq("id", application.id);

      if (acceptError) throw acceptError;

      // Reject other applications
      const { error: rejectError } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("job_id", application.job_id)
        .neq("id", application.id);

      if (rejectError) throw rejectError;

      // Update job
      const { error: jobError } = await supabase
        .from("jobs")
        .update({
          worker_id: application.worker_id,
          status: "assigned",
        })
        .eq("id", application.job_id);

      if (jobError) throw jobError;

      // Send notifications
      await Promise.all([
        notifyApplicationAccepted(
          application.worker_id,
          application.job?.title || "a job",
          application.job_id,
          currentUser?.user_metadata?.full_name || "A client"
        ),
        notifyJobStatusChanged(
          application.worker_id,
          application.job?.title || "a job",
          "assigned",
          application.job_id,
          "worker"
        ),
      ]);

      toast.success("Application accepted successfully!");
      toast.info(`Notification sent to ${application.worker?.full_name}`);

      router.push(`/customer/dashboard/applications`);
    } catch (error: any) {
      console.error("Error accepting application:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", application.id);

      if (error) throw error;

      await notifyApplicationRejected(
        application.worker_id,
        application.job?.title || "a job",
        application.job_id
      );

      toast.success("Application rejected");
      toast.info(`Notification sent to ${application.worker?.full_name}`);

      router.push(`/customer/dashboard/applications`);
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
      setShowRejectConfirm(false);
    }
  };

  const handleContact = useCallback(() => {
    if (!application) return;
    router.push(
      `/customer/dashboard/chat/${application.job_id}?worker=${application.worker_id}`
    );
  }, [application, router]);

  const handleViewJob = useCallback(() => {
    if (!application) return;
    router.push(`/customer/job/${application.job_id}`);
  }, [application, router]);

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleShare = async () => {
    try {
      await navigator.share?.({
        title: `Application from ${application?.worker?.full_name}`,
        text: `Check out this application for ${application?.job?.title}`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
    setIsShareOpen(false);
  };

  // ============== Utility Functions ==============
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getTradeCategoryIcon = (category: string | undefined) => {
    const icons: Record<string, any> = {
      plumbing: Droplets,
      electrical: Zap,
      carpentry: Hammer,
      painting: Paintbrush,
      hvac: Thermometer,
      landscaping: TreePine,
      cleaning: Sparkles,
      moving: Truck,
    };
    const Icon = icons[category?.toLowerCase() || ""] || Wrench;
    return <Icon className="w-4 h-4" />;
  };

  const getLevelBadge = (level: string | undefined | null) => {
    const badges: Record<string, { color: string; label: string }> = {
      beginner: { color: "bg-gray-100 text-gray-700", label: "Beginner" },
      intermediate: {
        color: "bg-purple-100 text-purple-700",
        label: "Intermediate",
      },
      expert: { color: "bg-purple-100 text-purple-700", label: "Expert" },
      master: { color: "bg-yellow-100 text-yellow-700", label: "Master" },
    };

    if (!level || !badges[level]) return null;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badges[level].color}`}
      >
        {badges[level].label}
      </span>
    );
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { color: string; bgColor: string; icon: any; label: string }
    > = {
      pending: {
        color: "text-yellow-800",
        bgColor: "bg-yellow-100",
        icon: Clock,
        label: "Pending Review",
      },
      accepted: {
        color: "text-green-800",
        bgColor: "bg-green-100",
        icon: CheckCircle,
        label: "Accepted",
      },
      rejected: {
        color: "text-red-800",
        bgColor: "bg-red-100",
        icon: XCircle,
        label: "Rejected",
      },
    };
    return configs[status] || configs.pending;
  };

  const getYearsOfExperience = (createdAt: string | undefined) => {
    if (!createdAt) return "0";
    const start = new Date(createdAt);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    return years > 0 ? `${years}+` : "<1";
  };

  // ============== Memoized Values ==============
  const breadcrumbItems = useMemo(
    () => [
      { label: "Applications", href: "/customer/all-applications" },
      {
        label: application?.worker?.full_name || "Application",
        href: "#",
        current: true,
      },
    ],
    [application]
  );

  const statusConfig = useMemo(
    () => (application ? getStatusConfig(application.status) : null),
    [application]
  );

  // ============== Loading State ==============
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 -4  -t-purple-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Loading Application
          </h3>
          <p className="text-gray-500">
            Please wait while we fetch the details...
          </p>
        </div>
      </div>
    );
  }

  // ============== Error State ==============
  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The application you're looking for doesn't exist or has been
            removed.
          </p>
          <Link
            href="/customer/all-applications"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-lg hover:from-purple-700 hover:to-purple-700 transition shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  // ============== Main Render ==============
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md -b sticky top-0 z-50 ">
        <div className=" px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition group"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              </button>

              {/* Breadcrumb */}
              <nav className="hidden sm:flex items-center space-x-2 text-sm">
                <Link
                  href="/"
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  Home
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <Link
                  href="/customer/all-applications"
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  Applications
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {application.worker?.full_name}
                </span>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-lg transition relative group ${
                  isFavorite
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  {isFavorite ? "Remove from favorites" : "Add to favorites"}
                </span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsShareOpen(!isShareOpen)}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                {isShareOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl  py-1 z-50">
                    <button
                      onClick={handleShare}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share via...
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied!");
                        setIsShareOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy link
                    </button>
                  </div>
                )}
              </div>

              <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="  py-8">
        {/* Status Banner */}
        {application.status !== "pending" && statusConfig && (
          <div
            className={`mb-6 p-4 rounded-xl ${statusConfig.bgColor}  flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <statusConfig.icon
                  className={`w-5 h-5 ${statusConfig.color}`}
                />
              </div>
              <div>
                <h3 className={`font-semibold ${statusConfig.color}`}>
                  Application {statusConfig.label}
                </h3>
                <p className="text-sm text-gray-600">
                  {application.status === "accepted"
                    ? "This worker has been assigned to the job"
                    : "This application was not selected"}
                </p>
              </div>
            </div>
            {application.status === "accepted" && (
              <button
                onClick={handleContact}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Worker
              </button>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleContact}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <MessageCircle className="w-4 h-4" />
            Message Worker
          </button>
          <button
            onClick={handleViewJob}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2  shadow-sm"
          >
            <Briefcase className="w-4 h-4" />
            View Job
          </button>
          {application.worker?.phone && (
            <a
              href={`tel:${application.worker.phone}`}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2  shadow-sm"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
          <button className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2  shadow-sm">
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 -b bg-white rounded-t-xl">
          <nav className="flex gap-1 p-1">
            {[
              { id: "proposal", label: "Proposal", icon: FileText },
              { id: "job", label: "Job Details", icon: Briefcase },
              { id: "worker", label: "Worker Profile", icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Content */}
            {activeTab === "proposal" && (
              <>
                {/* Worker's Proposal Card */}
                <div className="bg-white rounded-2xl shadow-sm  overflow-hidden">
                  <div className="p-6 -b bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Worker's Proposal
                      </h2>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatRelativeTime(application.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {application.message || (
                          <span className="text-gray-400 italic">
                            No message provided with this application.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-purple-600 rounded-lg">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-purple-900">
                            Timeline
                          </span>
                        </div>
                        <p className="text-xl font-bold text-purple-900">
                          {application.job?.created_at
                            ? formatDate(application.job.created_at)
                            : "Flexible"}
                        </p>
                        <p className="text-xs text-purple-700 mt-1">
                          Expected start date
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-green-600 rounded-lg">
                            <DollarSign className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-green-900">
                            Budget
                          </span>
                        </div>
                        <p className="text-xl font-bold text-green-900">
                          {formatCurrency(application.job?.price)}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          {application.worker?.rate_type === "hourly"
                            ? "Hourly rate"
                            : "Fixed price"}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-purple-600 rounded-lg">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-purple-900">
                            Location
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-purple-900 truncate">
                          {application.job?.location}
                        </p>
                        <p className="text-xs text-purple-700 mt-1">Job site</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Details (if not expanded) */}
                {application.job && <JobDetailsCard job={application.job} />}
              </>
            )}

            {activeTab === "job" && application.job && (
              <JobDetailsCard job={application.job} expanded />
            )}

            {activeTab === "worker" && application.worker && (
              <WorkerProfileCard
                worker={application.worker}
                completedJobsCount={completedJobsCount}
                showAllDetails={showAllDetails}
                onToggleDetails={() => setShowAllDetails(!showAllDetails)}
              />
            )}
          </div>

          {/* Right Column - Worker Summary & Actions */}
          <div className="space-y-6">
            {/* Worker Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm  overflow-hidden sticky top-24">
              {/* Card Header with Gradient */}
              <div className="p-6 bg-gradient-to-r from-purple-600 to-purple-600">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold -2 -white overflow-hidden backdrop-blur-sm">
                      {application.worker?.avatar_url ? (
                        <img
                          src={application.worker.avatar_url}
                          alt={application.worker.full_name}
                          className="object-cover"
                        />
                      ) : (
                        application.worker?.full_name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    {application.worker?.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full -2 -white flex items-center justify-center">
                        <BadgeCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">
                      {application.worker?.full_name}
                    </h3>
                    <p className="text-purple-100 text-sm flex items-center gap-1">
                      {getTradeCategoryIcon(application.worker?.trade_category)}
                      {application.worker?.job_title || "Professional"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">
                      {completedJobsCount}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      Jobs Done
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">
                      {application.worker?.rating?.toFixed(1) || "New"}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                      <Star className="w-3 h-3" />
                      Rating
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 truncate flex-1">
                      {application.worker?.email}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          application.worker?.email || ""
                        );
                        toast.success("Email copied!");
                      }}
                      className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>

                  {application.worker?.phone && (
                    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition group">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 flex-1">
                        {application.worker.phone}
                      </span>
                      <a
                        href={`tel:${application.worker.phone}`}
                        className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <PhoneCall className="w-3 h-3 text-gray-400" />
                      </a>
                    </div>
                  )}

                  {application.worker?.city && (
                    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 truncate">
                        {[application.worker.city, application.worker.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {application.worker?.skills &&
                  application.worker.skills.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {application.worker.skills
                          .slice(0, 5)
                          .map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        {application.worker.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{application.worker.skills.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {/* Rate Information */}
                {application.worker?.rate_type && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {application.worker.rate_type === "hourly" &&
                          "Hourly Rate"}
                        {application.worker.rate_type === "fixed" &&
                          "Fixed Rate"}
                        {application.worker.rate_type === "project" &&
                          "Project Rate"}
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(application.worker.hourly_rate)}
                        {application.worker.rate_type === "hourly" && "/hr"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Info className="w-3 h-3" />
                      Their usual rate for similar work
                    </div>
                  </div>
                )}

                {/* Insurance Status */}
                {application.worker?.insurance_url && (
                  <div className="mb-6 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        className={`w-4 h-4 ${
                          application.worker.insurance_verified
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Insurance
                      </span>
                    </div>
                    {application.worker.insurance_verified ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {application.status === "pending" ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleAccept}
                      disabled={processing}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 -2 -white -t-transparent"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Accept Application
                        </>
                      )}
                    </button>

                    {!showRejectConfirm ? (
                      <button
                        onClick={() => setShowRejectConfirm(true)}
                        disabled={processing}
                        className="w-full py-3 -2 -red-200 text-red-600 rounded-xl hover:bg-red-50 transition font-medium flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Application
                      </button>
                    ) : (
                      <div className="space-y-3 p-4 bg-red-50 rounded-xl -2 -red-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">
                            Are you sure you want to reject this application?
                            This action cannot be undone.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowRejectConfirm(false)}
                            disabled={processing}
                            className="flex-1 py-2 -2 -gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleReject}
                            disabled={processing}
                            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
                          >
                            {processing ? "..." : "Confirm"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleContact}
                      className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Contact Worker
                    </button>
                    <button
                      onClick={handleViewJob}
                      className="w-full py-3  -gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
                    >
                      <Briefcase className="w-4 h-4" />
                      View Job Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============== Job Details Card Component ==============
function JobDetailsCard({
  job,
  expanded = false,
}: {
  job: Job;
  expanded?: boolean;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-100 text-green-800",
      assigned: "bg-purple-100 text-purple-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm  overflow-hidden">
      <div className="p-6 -b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Job Details
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              job.status
            )}`}
          >
            {job.status.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">{job.description}</p>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Category</p>
              <p className="font-medium text-gray-900">{job.category}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Budget</p>
              <p className="font-medium text-gray-900">
                {formatCurrency(job.price)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium text-gray-900">{job.location}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Posted on</p>
              <p className="font-medium text-gray-900">
                {formatDate(job.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <>
            {/* Timeline */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Posted: {formatDate(job.created_at)}
                  </span>
                </div>
                {job.start_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Start: {formatDate(job.start_date)}
                    </span>
                  </div>
                )}
                {job.end_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      End: {formatDate(job.end_date)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Requirements
                </h4>
                <ul className="space-y-2">
                  {job.requirements.map((req, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Images */}
        {job.images && job.images.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              Photos ({job.images.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {job.images.slice(0, expanded ? undefined : 3).map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden  group cursor-pointer hover:shadow-lg transition"
                >
                  <img
                    src={img}
                    alt={`Job image ${i + 1}`}
                    className="object-cover transition group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============== Worker Profile Card Component ==============
function WorkerProfileCard({
  worker,
  completedJobsCount,
  showAllDetails,
  onToggleDetails,
}: {
  worker: WorkerProfile;
  completedJobsCount: number;
  showAllDetails: boolean;
  onToggleDetails: () => void;
}) {
  const toast = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTradeCategoryIcon = (category: string | undefined) => {
    const icons: Record<string, any> = {
      plumbing: Droplets,
      electrical: Zap,
      carpentry: Hammer,
      painting: Paintbrush,
      hvac: Thermometer,
      landscaping: TreePine,
      cleaning: Sparkles,
      moving: Truck,
    };
    const Icon = icons[category?.toLowerCase() || ""] || Wrench;
    return <Icon className="w-4 h-4" />;
  };

  const getLevelBadge = (level: string | undefined | null) => {
    const badges: Record<string, { color: string; label: string }> = {
      beginner: { color: "bg-gray-100 text-gray-700", label: "Beginner" },
      intermediate: {
        color: "bg-purple-100 text-purple-700",
        label: "Intermediate",
      },
      expert: { color: "bg-purple-100 text-purple-700", label: "Expert" },
      master: { color: "bg-yellow-100 text-yellow-700", label: "Master" },
    };

    if (!level || !badges[level]) return null;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badges[level].color}`}
      >
        {badges[level].label}
      </span>
    );
  };

  const getYearsOfExperience = (createdAt: string | undefined) => {
    if (!createdAt) return "0";
    const start = new Date(createdAt);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    return years > 0 ? `${years}+` : "<1";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm  overflow-hidden">
      <div className="p-6 -b bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5" />
          Complete Profile
        </h2>
      </div>

      <div className="p-6">
        {/* Profile Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-purple-500 mx-auto flex items-center justify-center text-white font-bold text-3xl mb-3 -4 -white shadow-lg overflow-hidden">
              {worker.avatar_url ? (
                <img
                  src={worker.avatar_url}
                  alt={worker.full_name}
                  className="object-cover"
                />
              ) : (
                worker.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            {worker.verified && (
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-purple-500 rounded-full -2 -white flex items-center justify-center">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900">
            {worker.full_name}
          </h3>
          <p className="text-gray-600 flex items-center justify-center gap-1">
            {getTradeCategoryIcon(worker.trade_category)}
            {worker.job_title || worker.trade_category || "Professional"}
          </p>

          <div className="mt-2 flex justify-center gap-2">
            {getLevelBadge(worker.level)}
            {worker.insurance_verified && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Insured
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl text-center">
            <Briefcase className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">
              {completedJobsCount}
            </p>
            <p className="text-xs text-gray-600">Jobs Done</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl text-center">
            <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">
              {getYearsOfExperience(worker.created_at)}
            </p>
            <p className="text-xs text-gray-600">Years Exp</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl text-center">
            <Star className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">
              {worker.rating?.toFixed(1) || "New"}
            </p>
            <p className="text-xs text-gray-600">Rating</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 truncate flex-1">
              {worker.email}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(worker.email);
                toast.success("Email copied!");
              }}
              className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition"
            >
              <Copy className="w-3 h-3 text-gray-400" />
            </button>
          </div>

          {worker.phone && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 flex-1">
                {worker.phone}
              </span>
              <a
                href={`tel:${worker.phone}`}
                className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition"
              >
                <PhoneCall className="w-3 h-3 text-gray-400" />
              </a>
            </div>
          )}

          {(worker.address || worker.city) && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 truncate">
                {[worker.address, worker.city, worker.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Award className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Member since {formatDate(worker.created_at || "")}
            </span>
          </div>
        </div>

        {/* Skills */}
        {worker.skills && worker.skills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1">
              {worker.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rate Information */}
        {worker.rate_type && (
          <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Rate Information
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 capitalize">
                {worker.rate_type} Rate
              </span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(worker.hourly_rate)}
                {worker.rate_type === "hourly" && "/hr"}
              </span>
            </div>
          </div>
        )}

        {/* Toggle Details Button */}
        <button
          onClick={onToggleDetails}
          className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium mb-4 flex items-center justify-center gap-1 p-2 hover:bg-purple-50 rounded-lg transition"
        >
          <Info className="w-4 h-4" />
          {showAllDetails ? "Show less" : "Show all details"}
          {showAllDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Expanded Details */}
        {showAllDetails && (
          <div className="space-y-4 -t pt-4">
            <h4 className="text-sm font-medium text-gray-900">
              Additional Information
            </h4>

            {/* Bank Information */}
            {worker.bank_name && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Landmark className="w-3 h-3" />
                  Bank Information
                </p>
                <div className="pl-4 space-y-1">
                  <p className="text-sm text-gray-600">
                    Bank: {worker.bank_name}
                  </p>
                  {worker.bank_account_holder && (
                    <p className="text-sm text-gray-600">
                      Holder: {worker.bank_account_holder}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Trade Details */}
            {worker.trade_category && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">
                  Trade Category
                </p>
                <p className="text-sm text-gray-900 capitalize">
                  {worker.trade_category.replace("_", " ")}
                </p>
              </div>
            )}

            {/* Full Address */}
            {(worker.address || worker.city) && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">
                  Full Address
                </p>
                <p className="text-sm text-gray-900">
                  {[
                    worker.address,
                    worker.city,
                    worker.country,
                    worker.zip_code,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
