"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Users,
  Clock,
  Plus,
  Briefcase,
  Zap,
  DollarSign,
  ChevronRight,
  Loader2,
  Eye,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  LayoutGrid,
  List,
  TrendingUp,
  Award,
  Star,
  Bell,
  Settings,
  Home,
  BarChart3,
  FileText,
  UserCircle,
  LogOut,
  Menu,
  X as XIcon,
  CheckCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Sparkles,
  Rocket,
  Target,
  Shield,
  Clock3,
  CalendarDays,
  MapPinned,
  Briefcase as BriefcaseIcon,
  Wallet,
  TrendingUp as TrendingUpIcon,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Share2,
  Bookmark,
  MoreVertical,
  EyeOff,
  Trash2,
  Edit,
  Copy,
  Check,
  Send,
  Phone,
  Video,
  Camera,
  Image,
  Paperclip,
  Link2,
  Globe,
  Lock,
  Unlock,
  BellRing,
  BellOff,
  Moon,
  Sun,
  Settings2,
  RefreshCw,
  Filter as FilterIcon,
  SlidersHorizontal,
  SortAsc,
  SortDesc,
  Grid3x3,
  List as ListIcon,
  LayoutList,
  LayoutGrid as LayoutGridIcon,
} from "lucide-react";

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
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  images: string[];
  worker_id: string | null;
  location: string;
  date: string;
  level_required: string;
  urgency: string;
  applications_count?: number;
  worker?: {
    full_name: string;
    avatar_url?: string;
    rating?: number;
  } | null;
};

type FilterType =
  | "all"
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

type ViewMode = "grid" | "list";
type SortOption =
  | "newest"
  | "oldest"
  | "applications"
  | "budget_high"
  | "budget_low";

export default function CustomerMyJobsContent() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  useEffect(() => {
    if (success === "true") {
      showNotification("Job posted successfully!", "success");
    }
    fetchMyJobs();
  }, []);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    // You can implement a toast notification here
    console.log(`${type}: ${message}`);
  };

  const fetchMyJobs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setError("User not authenticated");
        return;
      }

      // First, fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      if (!jobsData || jobsData.length === 0) {
        setJobs([]);
        return;
      }

      // Then, fetch applications count for each job
      const jobsWithDetails = await Promise.all(
        jobsData.map(async (job) => {
          // Get applications count
          const { count: applicationsCount, error: countError } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id);

          if (countError)
            console.error("Error fetching applications count:", countError);

          // Get worker details if job is assigned
          let workerDetails = null;
          if (job.worker_id) {
            const { data: workerData, error: workerError } = await supabase
              .from("profiles")
              .select("full_name, avatar_url, rating")
              .eq("id", job.worker_id)
              .single();

            if (!workerError && workerData) {
              workerDetails = workerData;
            }
          }

          return {
            ...job,
            applications_count: applicationsCount || 0,
            worker: workerDetails,
          };
        })
      );

      setJobs(jobsWithDetails);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Please try again.");
      showNotification("Failed to load jobs", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Memoized filtered and sorted jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter((job) => {
      if (filter !== "all" && job.status !== filter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          job.title.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term) ||
          job.category.toLowerCase().includes(term)
        );
      }
      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "applications":
          return (b.applications_count || 0) - (a.applications_count || 0);
        case "budget_high":
          return (b.fixed_rate || 0) - (a.fixed_rate || 0);
        case "budget_low":
          return (a.fixed_rate || 0) - (b.fixed_rate || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [jobs, filter, searchTerm, sortBy]);

  // Memoized stats
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const jobsThisMonth = jobs.filter(
      (j) => new Date(j.created_at) > thirtyDaysAgo
    ).length;

    const jobsLastMonth = jobs.filter((j) => {
      const date = new Date(j.created_at);
      return date > thirtyDaysAgo && date < now;
    }).length;

    const percentageChange = jobsLastMonth
      ? (((jobsThisMonth - jobsLastMonth) / jobsLastMonth) * 100).toFixed(1)
      : "0";

    return {
      total: jobs.length,
      open: jobs.filter((j) => j.status === "open").length,
      assigned: jobs.filter((j) => j.status === "assigned").length,
      inProgress: jobs.filter((j) => j.status === "in_progress").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      cancelled: jobs.filter((j) => j.status === "cancelled").length,
      totalApplications: jobs.reduce(
        (acc, job) => acc + (job.applications_count || 0),
        0
      ),
      averageApplications:
        jobs.length > 0
          ? Math.round(
              jobs.reduce(
                (acc, job) => acc + (job.applications_count || 0),
                0
              ) / jobs.length
            )
          : 0,
      completionRate:
        jobs.length > 0
          ? Math.round(
              (jobs.filter((j) => j.status === "completed").length /
                jobs.length) *
                100
            )
          : 0,
      totalSpent: jobs.reduce((acc, job) => {
        if (job.status === "completed") {
          return acc + (job.fixed_rate || job.min_rate || job.hourly_rate || 0);
        }
        return acc;
      }, 0),
      jobsThisMonth,
      percentageChange,
    };
  }, [jobs]);

  const getStatusConfig = (status: string) => {
    const configs = {
      open: {
        icon: AlertCircle,
        text: "Open",
        bg: "bg-emerald-50",
        textColor: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        gradient: "from-emerald-500 to-emerald-600",
        lightBg: "bg-emerald-50/50",
      },
      assigned: {
        icon: Users,
        text: "Assigned",
        bg: "bg-purple-50",
        textColor: "text-purple-700",
        border: "border-purple-200",
        dot: "bg-purple-500",
        gradient: "from-purple-500 to-purple-600",
        lightBg: "bg-purple-50/50",
      },
      in_progress: {
        icon: Clock,
        text: "In Progress",
        bg: "bg-amber-50",
        textColor: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
        gradient: "from-amber-500 to-amber-600",
        lightBg: "bg-amber-50/50",
      },
      completed: {
        icon: CheckCircle2,
        text: "Completed",
        bg: "bg-green-50",
        textColor: "text-green-700",
        border: "border-green-200",
        dot: "bg-green-500",
        gradient: "from-green-500 to-green-600",
        lightBg: "bg-green-50/50",
      },
      cancelled: {
        icon: XCircle,
        text: "Cancelled",
        bg: "bg-rose-50",
        textColor: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
        gradient: "from-rose-500 to-rose-600",
        lightBg: "bg-rose-50/50",
      },
    };
    return configs[status as keyof typeof configs] || configs.open;
  };

  const formatPrice = (job: Job) => {
    switch (job.pay_type) {
      case "Fixed":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(job.fixed_rate || 0);
      case "Range":
        return `${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(job.min_rate || 0)} - ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(job.max_rate || 0)}`;
      case "Hourly":
        return (
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          }).format(job.hourly_rate || 0) + "/hr"
        );
      default:
        return "Price TBD";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      urgent: "bg-rose-100 text-rose-700 border-rose-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      medium: "bg-amber-100 text-amber-700 border-amber-200",
      low: "bg-emerald-100 text-emerald-700 border-emerald-200",
      flexible: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return (
      colors[urgency?.toLowerCase() as keyof typeof colors] || colors.flexible
    );
  };

  const getLevelColor = (level: string) => {
    const colors = {
      beginner: "bg-blue-100 text-blue-700 border-blue-200",
      intermediate: "bg-indigo-100 text-indigo-700 border-indigo-200",
      expert: "bg-purple-100 text-purple-700 border-purple-200",
      master: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return (
      colors[level?.toLowerCase() as keyof typeof colors] || colors.beginner
    );
  };

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    trend,
    trendValue,
  }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>{trendValue}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );

  const JobCard = ({ job }: { job: Job }) => {
    const statusConfig = getStatusConfig(job.status);
    const StatusIcon = statusConfig.icon;
    const applicationsCount = job.applications_count || 0;
    const isSelected = selectedJobs.includes(job.id);

    return (
      <Link
        href={`/customer/dashboard/my-jobs/${job.id}`}
        className={`block bg-white rounded-xl border ${
          isSelected
            ? "border-purple-400 ring-2 ring-purple-200"
            : "border-gray-200"
        } hover:shadow-lg transition-all group`}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`px-2 py-1 rounded-full ${statusConfig.bg} border ${statusConfig.border} flex items-center gap-1.5`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                />
                <span
                  className={`text-xs font-medium ${statusConfig.textColor}`}
                >
                  {statusConfig.text}
                </span>
              </div>
              {job.urgency === "urgent" && (
                <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Urgent
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                if (isSelected) {
                  setSelectedJobs(selectedJobs.filter((id) => id !== job.id));
                } else {
                  setSelectedJobs([...selectedJobs, job.id]);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition"
            >
              <CheckCircle
                className={`w-4 h-4 ${
                  isSelected ? "text-purple-600" : "text-gray-300"
                }`}
              />
            </button>
          </div>

          {/* Title and Price */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 flex-1">
              {job.title}
            </h3>
            <div className="text-right ml-3">
              <p className="text-xl font-bold text-gray-900">
                {formatPrice(job)}
              </p>
              <p className="text-xs text-gray-500">{job.pay_type}</p>
            </div>
          </div>

          {/* Location and Date */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{job.location || "Location TBD"}</span>
            </div>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {job.date
                  ? new Date(job.date).toLocaleDateString()
                  : "Flexible"}
              </span>
            </div>
          </div>

          {/* Description Preview */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {job.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {job.category}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getLevelColor(
                job.level_required
              )}`}
            >
              {job.level_required || "Any level"}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(
                job.urgency
              )}`}
            >
              {job.urgency || "Flexible"}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {applicationsCount}
                </span>
                <span className="text-gray-500">applicants</span>
              </div>
              {job.worker && (
                <>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                      {job.worker.avatar_url ? (
                        <img
                          src={job.worker.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircle className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <span className="text-gray-600 truncate max-w-[100px]">
                      {job.worker.full_name}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 text-purple-600">
              <span className="text-sm font-medium">Details</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Progress bar for in_progress jobs */}
          {job.status === "in_progress" && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-900">65%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                  style={{ width: "65%" }}
                />
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  };

  const JobListItem = ({ job }: { job: Job }) => {
    const statusConfig = getStatusConfig(job.status);
    const StatusIcon = statusConfig.icon;
    const applicationsCount = job.applications_count || 0;

    return (
      <Link
        href={`/customer/dashboard/my-jobs/${job.id}`}
        className="block bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all group"
      >
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={`p-3 rounded-xl ${statusConfig.bg}`}>
              <StatusIcon className={`w-5 h-5 ${statusConfig.textColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {job.title}
                </h3>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${statusConfig.bg} ${statusConfig.textColor}`}
                >
                  {statusConfig.text}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{job.location || "TBD"}</span>
                </div>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(job.created_at)}</span>
                </div>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{applicationsCount} applicants</span>
                </div>
              </div>
            </div>

            {/* Price and Action */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatPrice(job)}</p>
                <p className="text-xs text-gray-500">{job.pay_type}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-purple-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Loading your jobs
          </h3>
          <p className="text-sm text-gray-500">
            Please wait while we fetch your listings...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchMyJobs()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setShowMobileMenu(false)}>
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <nav className="space-y-2">
                <Link
                  href="/customer/dashboard"
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/customer/dashboard/my-jobs"
                  className="flex items-center gap-2 p-2 bg-purple-50 text-purple-600 rounded-lg"
                >
                  <Briefcase className="w-4 h-4" />
                  My Jobs
                </Link>
                <Link
                  href="/customer/dashboard/applications"
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Users className="w-4 h-4" />
                  Applications
                </Link>
                <Link
                  href="/customer/dashboard/messages"
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>
                <Link
                  href="/customer/dashboard/profile"
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  href="/customer/dashboard/settings"
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold ">My Jobs</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage and track all your job listings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchMyJobs(true)}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 relative group"
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-600 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  Refresh
                </span>
              </button>

              <Link
                href="/customer/dashboard/create-job"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Post New Job</span>
                <span className="sm:hidden">New</span>
              </Link>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              />
            </div>

            <div className="flex gap-2">
              {/* View Toggle */}
              <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition ${
                    viewMode === "grid"
                      ? "bg-purple-100 text-purple-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <LayoutGridIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition ${
                    viewMode === "list"
                      ? "bg-purple-100 text-purple-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="applications">Most applications</option>
                <option value="budget_high">Highest budget</option>
                <option value="budget_low">Lowest budget</option>
              </select>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 border rounded-lg transition flex items-center gap-2 ${
                  filter !== "all"
                    ? "bg-purple-50 border-purple-200 text-purple-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {filter !== "all" && (
                  <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                    1
                  </span>
                )}
              </button>

              {/* Bulk Actions (when jobs selected) */}
              {selectedJobs.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <span className="text-sm">Bulk Actions</span>
                  <span className="px-1.5 py-0.5 bg-white text-purple-600 text-xs rounded-full">
                    {selectedJobs.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Filter by status</h3>
                <button
                  onClick={() => setFilter("all")}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "all", label: "All Jobs", count: stats.total },
                    { value: "open", label: "Open", count: stats.open },
                    {
                      value: "assigned",
                      label: "Assigned",
                      count: stats.assigned,
                    },
                    {
                      value: "in_progress",
                      label: "In Progress",
                      count: stats.inProgress,
                    },
                    {
                      value: "completed",
                      label: "Completed",
                      count: stats.completed,
                    },
                    {
                      value: "cancelled",
                      label: "Cancelled",
                      count: stats.cancelled,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
                      filter === f.value
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded-full ${
                        filter === f.value
                          ? "bg-white text-purple-600"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(searchTerm || filter !== "all") && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-500">Active filters:</span>
              {searchTerm && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:text-gray-900"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filter !== "all" && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                  Status: {filter.replace("_", " ")}
                  <button
                    onClick={() => setFilter("all")}
                    className="ml-1 hover:text-gray-900"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                }}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-900">
              {filteredJobs.length}
            </span>{" "}
            of <span className="font-medium text-gray-900">{stats.total}</span>{" "}
            jobs
          </p>
          <p className="text-xs text-gray-400">
            Last updated {formatDate(new Date().toISOString())}
          </p>
        </div>

        {/* Jobs Grid/List */}
        {filteredJobs.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <JobListItem key={job.id} job={job} />
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm || filter !== "all"
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Get started by posting your first job and find the perfect worker for your project."}
            </p>

            {(searchTerm || filter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                }}
                className="text-purple-600 hover:text-purple-700 font-medium mb-6 block mx-auto"
              >
                Clear all filters
              </button>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/customer/dashboard/create-job"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Post a New Job
              </Link>
              <button
                onClick={() => fetchMyJobs()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Suggestions */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Popular categories
              </h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Plumbing",
                  "Electrical",
                  "Carpentry",
                  "Painting",
                  "Cleaning",
                  "Moving",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSearchTerm(cat)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bulk Actions Modal */}
      {showBulkActions && selectedJobs.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex gap-2 z-50">
          <button className="px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button className="px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm text-red-600">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={() => setSelectedJobs([])}
            className="px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
          >
            <XIcon className="w-4 h-4" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
