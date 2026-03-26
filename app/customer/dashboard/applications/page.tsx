"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  Star,
  Users,
  XCircle,
  Briefcase,
  DollarSign,
  Award,
  TrendingUp,
  X,
  AlertCircle,
  ThumbsUp,
} from "lucide-react";

import { useToast } from "@/contexts/ToastContext";
import { RatingSummary } from "./[id]/components/shared/rate/RatingSummary";
import { RateButton } from "./[id]/components/shared/rate/RateButton";

// Définir le type Job localement pour éviter les problèmes d'import
type Job = {
  id: string;
  title: string;
  category: string;
  price?: number;
  fixed_rate?: number;
  min_rate?: number;
  max_rate?: number;
  hourly_rate?: number;
  pay_type?: "Fixed" | "Range" | "Hourly" | string;
  location: string;
  status: string;
};

type Application = {
  id: string;
  job_id: string;
  worker_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  job?: Job;
  worker?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    job_title?: string;
    company_name?: string;
    trade_category?: string;
    skills?: string[];
    level?: string;
    hourly_rate?: number;
    rate_type?: string;
    business_verified?: boolean;
    insurance_verified?: boolean;
    loyalty_points?: number;
    city?: string;
    country?: string;
    business_city?: string;
    business_country?: string;
    rating?: number;
  };
};

type FilterType = "all" | "pending" | "accepted" | "rejected";
type SortType = "newest" | "oldest" | "price-high" | "price-low";

type Stats = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
};

// Composant pour afficher la note avec étoiles
function WorkerRatingDisplay({
  rating,
  size = "sm",
}: {
  rating?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  if (!rating || rating === 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full"></div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < Math.floor(rating)
                ? "fill-amber-500 text-amber-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-amber-700">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default function AllApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("newest");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [ratedJobs, setRatedJobs] = useState<Set<string>>(new Set());

  const router = useRouter();
  const toast = useToast();

  // Vérifier les ratings existants pour l'utilisateur
  const checkRatedJobs = useCallback(
    async (userId: string, jobsToCheck: string[]) => {
      if (!userId || jobsToCheck.length === 0) return;

      try {
        const { data, error } = await supabase
          .from("rates")
          .select("job_id")
          .eq("reviewer_id", userId)
          .in("job_id", jobsToCheck);

        if (error) throw error;

        const ratedSet = new Set(data?.map((r) => r.job_id) || []);
        setRatedJobs(ratedSet);
      } catch (error) {
        console.error("Error checking rated jobs:", error);
      }
    },
    []
  );

  // Fonction pour formater le prix
  const formatPrice = (job?: Job) => {
    if (!job) return "Price TBD";

    const payType = job.pay_type?.toLowerCase();

    if (
      job.hourly_rate &&
      (payType === "hourly" ||
        payType === "hour" ||
        payType === "hr" ||
        payType?.includes("hour"))
    ) {
      return (
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(job.hourly_rate) + "/hr"
      );
    }

    if (
      job.fixed_rate &&
      (payType === "fixed" || payType === "fix" || payType?.includes("fixed"))
    ) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(job.fixed_rate);
    }

    if (
      job.min_rate &&
      job.max_rate &&
      (payType === "range" || payType === "rng" || payType?.includes("range"))
    ) {
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

    if (job.hourly_rate) {
      return (
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(job.hourly_rate) + "/hr"
      );
    }

    if (job.fixed_rate) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(job.fixed_rate);
    }

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

    return "//";
  };

  // Memoized filtered and sorted applications
  const filteredApplications = useMemo(() => {
    let filtered = [...applications];

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.job?.title?.toLowerCase().includes(term) ||
          app.worker?.full_name?.toLowerCase().includes(term) ||
          app.worker?.email?.toLowerCase().includes(term) ||
          app.worker?.company_name?.toLowerCase().includes(term) ||
          app.worker?.trade_category?.toLowerCase().includes(term) ||
          app.worker?.skills?.some((skill) =>
            skill.toLowerCase().includes(term)
          )
      );
    }

    filtered.sort((a, b) => {
      const getComparablePrice = (job?: Job) => {
        if (!job) return 0;
        switch (job.pay_type) {
          case "Fixed":
            return job.fixed_rate || 0;
          case "Hourly":
            return job.hourly_rate || 0;
          case "Range":
            return job.max_rate || 0;
          default:
            return job.price || 0;
        }
      };

      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "price-high":
          return getComparablePrice(b.job) - getComparablePrice(a.job);
        case "price-low":
          return getComparablePrice(a.job) - getComparablePrice(b.job);
        default:
          return 0;
      }
    });

    return filtered;
  }, [applications, searchTerm, statusFilter, sortBy]);

  // Fetch applications
  const fetchAllApplications = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      setFetchError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select(
            `
            id, 
            title, 
            category, 
            price,
            fixed_rate,
            min_rate,
            max_rate,
            hourly_rate,
            pay_type,
            location, 
            status
          `
          )
          .eq("customer_id", user.id);

        if (jobsError) throw jobsError;

        if (!jobsData?.length) {
          setApplications([]);
          setStats({ total: 0, pending: 0, accepted: 0, rejected: 0 });
          return;
        }

        const jobIds = jobsData.map((job) => job.id);
        const { data: appsData, error: appsError } = await supabase
          .from("applications")
          .select("*")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false });

        if (appsError) throw appsError;

        if (!appsData?.length) {
          setApplications([]);
          setStats({ total: 0, pending: 0, accepted: 0, rejected: 0 });
          return;
        }

        const workerIds = [...new Set(appsData.map((app) => app.worker_id))];
        const { data: workersData, error: workersError } = await supabase
          .from("profiles")
          .select(
            `
            id, 
            full_name, 
            email, 
            avatar_url,
            job_title,
            company_name,
            trade_category,
            skills,
            level,
            hourly_rate,
            rate_type,
            business_verified,
            insurance_verified,
            loyalty_points,
            city,
            country,
            business_city,
            business_country,
            rating
          `
          )
          .in("id", workerIds);

        if (workersError) throw workersError;

        const jobsMap = new Map(jobsData.map((job) => [job.id, job]));
        const workersMap = new Map(workersData?.map((w) => [w.id, w]) || []);

        const combinedData = appsData.map((app) => ({
          ...app,
          job: jobsMap.get(app.job_id),
          worker: workersMap.get(app.worker_id) || {
            id: app.worker_id,
            full_name: "Unknown Worker",
            email: "unknown@email.com",
          },
        }));

        const pending = combinedData.filter(
          (a) => a.status === "pending"
        ).length;
        const accepted = combinedData.filter(
          (a) => a.status === "accepted"
        ).length;
        const rejected = combinedData.filter(
          (a) => a.status === "rejected"
        ).length;

        setApplications(combinedData);
        setStats({ total: combinedData.length, pending, accepted, rejected });

        // Vérifier les jobs déjà notés
        const completedJobs = combinedData
          .filter((app) => app.job?.status === "completed")
          .map((app) => app.job_id);

        if (completedJobs.length > 0) {
          await checkRatedJobs(user.id, completedJobs);
        }
      } catch (error: any) {
        console.error("Error fetching applications:", error);
        setFetchError(
          error.message || "Erreur lors du chargement des applications"
        );
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [router, checkRatedJobs]
  );

  useEffect(() => {
    fetchAllApplications();
  }, [fetchAllApplications]);

  const handleRatingSuccess = (jobId: string) => {
    toast.success("Thank you for your rating!");
    setRatedJobs((prev) => new Set(prev).add(jobId));
    fetchAllApplications();
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        text: "Pending",
        bg: "bg-amber-50",
        textColor: "text-amber-700",
        border: "border-amber-200",
        iconColor: "text-amber-500",
        gradient: "from-amber-500 to-orange-500",
      },
      accepted: {
        icon: CheckCircle,
        text: "Accepted",
        bg: "bg-emerald-50",
        textColor: "text-emerald-700",
        border: "border-emerald-200",
        iconColor: "text-emerald-500",
        gradient: "from-emerald-500 to-teal-500",
      },
      rejected: {
        icon: XCircle,
        text: "Rejected",
        bg: "bg-rose-50",
        textColor: "text-rose-700",
        border: "border-rose-200",
        iconColor: "text-rose-500",
        gradient: "from-rose-500 to-pink-500",
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
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
        return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
      }
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const colorClasses: any = {
      purple: "bg-purple-50 text-purple-600",
      yellow: "bg-amber-50 text-amber-600",
      green: "bg-emerald-50 text-emerald-600",
      red: "bg-rose-50 text-rose-600",
    };

    return (
      <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div
              className={`p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 ${colorClasses[color]}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="col-span-full">
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-linear-to-tr from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative">
          <div className="w-20 h-20 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 transform-gpu animate-pulse">
            <Users className="w-10 h-10 text-white" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {searchTerm || statusFilter !== "all"
              ? "No matching applications"
              : "No applications yet"}
          </h3>

          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters to find what you're looking for"
              : "When workers apply to your jobs, they will appear here. Share your jobs to get applications."}
          </p>

          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setSortBy("newest");
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/25"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-linear-to-br from-purple-600 to-pink-600 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">
            Loading your applications...
          </p>
          <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <AlertCircle className="w-10 h-10 text-rose-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Failed to load
          </h3>
          <div className="bg-rose-50/50 backdrop-blur-sm border border-rose-200 rounded-xl p-4 mb-6">
            <p className="text-rose-700 text-sm">{fetchError}</p>
          </div>
          <button
            onClick={() => fetchAllApplications()}
            className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/25"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="relative mb-8">
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Applications
                </h1>
              </div>
              <p className="text-gray-500 ml-14">
                Track and manage all your job applications in one place
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => fetchAllApplications(true)}
                disabled={isRefreshing}
                className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 group"
              >
                <Loader2
                  className={`w-5 h-5 text-gray-600 group-hover:rotate-180 transition-transform duration-500 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Applications"
            value={stats.total}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Accepted"
            value={stats.accepted}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            color="red"
          />
        </div>

        {/* Filters Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 sticky top-4 z-10">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, job title, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as FilterType)
                  }
                  className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer py-2"
                >
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200">
                <Clock className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer py-2"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="price-high">Highest price</option>
                  <option value="price-low">Lowest price</option>
                </select>
              </div>
            </div>
          </div>

          {showMobileFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as FilterType)
                  }
                  className="flex-1 p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="flex-1 p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="price-high">Highest price</option>
                  <option value="price-low">Lowest price</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-900">
              {filteredApplications.length}
            </span>{" "}
            {filteredApplications.length === 1 ? "application" : "applications"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((app, index) => {
            const statusConfig = getStatusConfig(app.status);
            const StatusIcon = statusConfig.icon;
            const isJobCompleted = app.job?.status === "completed";
            const hasUserRated = ratedJobs.has(app.job_id);

            return (
              <div
                key={app.id}
                className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl overflow-hidden transition-all duration-300"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${statusConfig.gradient}`}
                />

                <div className="relative p-6">
                  {/* Header with User Info and Rating */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-lg">
                          {app.worker?.avatar_url ? (
                            <img
                              src={app.worker.avatar_url}
                              alt={app.worker.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl font-bold text-gray-600">
                              {app.worker?.full_name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {app.worker?.business_verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {app.worker?.full_name}
                          </h3>
                          {/* Rating Display à côté du nom */}
                          <WorkerRatingDisplay rating={app.worker?.rating} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {app.worker?.job_title ||
                            app.worker?.trade_category ||
                            "Worker"}
                        </p>
                        {app.worker?.company_name && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {app.worker.company_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${statusConfig.bg} border ${statusConfig.border}`}
                    >
                      <StatusIcon
                        className={`w-3.5 h-3.5 ${statusConfig.iconColor}`}
                      />
                      <span
                        className={`text-xs font-semibold ${statusConfig.textColor}`}
                      >
                        {statusConfig.text}
                      </span>
                    </div>
                  </div>

                  {/* Rating Summary */}
                  {app.worker?.id && (
                    <div className="mb-4">
                      <RatingSummary
                        userId={app.worker.id}
                        showDetails={false}
                      />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {app.worker?.hourly_rate && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-lg">
                        <DollarSign className="w-3 h-3 text-purple-600" />
                        <span className="text-xs font-medium text-purple-700">
                          {app.worker.hourly_rate}/
                          {app.worker.rate_type || "hr"}
                        </span>
                      </div>
                    )}

                    {app.worker?.level && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
                        <Award className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">
                          {app.worker.level}
                        </span>
                      </div>
                    )}

                    {(app.worker?.city || app.worker?.business_city) && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
                        <MapPin className="w-3 h-3 text-gray-600" />
                        <span className="text-xs text-gray-600">
                          {app.worker.city || app.worker.business_city}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {app.worker?.skills && app.worker.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {app.worker.skills.slice(0, 4).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-linear-to-r from-gray-50 to-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200"
                        >
                          {skill}
                        </span>
                      ))}
                      {app.worker.skills.length > 4 && (
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs border border-gray-200">
                          +{app.worker.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Job Info */}
                  <div className="bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 mb-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 flex-1">
                        {app.job?.title}
                      </h4>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700 ml-2">
                        {app.job?.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-purple-700 border border-purple-200">
                          {app.job?.category}
                        </span>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatPrice(app?.job)}
                          </p>
                          {app?.job?.pay_type && (
                            <p className="text-xs text-gray-500">
                              {app.job.pay_type}
                            </p>
                          )}
                        </div>
                      </div>

                      {app.job?.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-25">
                            {app.job.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rate Button - Only for completed jobs */}
                  {isJobCompleted && (
                    <div className="mb-4">
                      <RateButton
                        jobId={app.job_id}
                        workerId={app.worker?.id || ""}
                        workerName={app.worker?.full_name || "the worker"}
                        jobTitle={app.job?.title || "this job"}
                        jobStatus={app.job?.status || "completed"}
                        hasRated={hasUserRated}
                        onRatingSuccess={() => handleRatingSuccess(app.job_id)}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/customer/dashboard/chat/${app.job_id}?worker=${app.worker_id}`}
                      className="flex-1 px-4 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 group/btn"
                    >
                      <MessageSquare className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                      Message
                    </Link>
                    <Link
                      href={`/customer/dashboard/applications/${app.id}`}
                      className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:border-purple-600 hover:text-purple-600 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                    >
                      <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      Review
                    </Link>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Applied {formatDate(app.created_at)}
                    </span>
                    {app.status === "pending" && (
                      <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                        Awaiting review
                      </span>
                    )}
                    {isJobCompleted && !hasUserRated && (
                      <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Ready to rate
                      </span>
                    )}
                    {isJobCompleted && hasUserRated && (
                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        Rated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredApplications.length === 0 && <EmptyState />}
        </div>
      </div>
    </div>
  );
}
