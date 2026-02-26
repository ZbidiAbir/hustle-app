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
  applications?: { count: number }[];
};

type FilterType =
  | "all"
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  useEffect(() => {
    if (success === "true") {
      alert("✅ Job posted successfully!");
    }
    fetchMyJobs();
  }, []);

  const fetchMyJobs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) return;

      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          applications:applications(count)
        `
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Memoized filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filter !== "all" && job.status !== filter) return false;
      if (
        searchTerm &&
        !job.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
  }, [jobs, filter, searchTerm]);

  // Memoized stats
  const stats = useMemo(() => {
    return {
      total: jobs.length,
      open: jobs.filter((j) => j.status === "open").length,
      assigned: jobs.filter((j) => j.status === "assigned").length,
      inProgress: jobs.filter((j) => j.status === "in_progress").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      totalApplications: jobs.reduce(
        (acc, job) => acc + (job.applications?.[0]?.count || 0),
        0
      ),
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
      },
      assigned: {
        icon: Users,
        text: "Assigned",
        bg: "bg-purple-50",
        textColor: "text-purple-700",
        border: "border-purple-200",
        dot: "bg-purple-500",
      },
      in_progress: {
        icon: Clock,
        text: "In Progress",
        bg: "bg-amber-50",
        textColor: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
      },
      completed: {
        icon: CheckCircle2,
        text: "Completed",
        bg: "bg-green-50",
        textColor: "text-green-700",
        border: "border-green-200",
        dot: "bg-green-500",
      },
      cancelled: {
        icon: XCircle,
        text: "Cancelled",
        bg: "bg-rose-50",
        textColor: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      },
    };
    return configs[status as keyof typeof configs] || configs.open;
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
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-lg border border-gray-100 p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">My Jobs</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {stats.total} total · {stats.open} open
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchMyJobs(true)}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                <Loader2
                  className={`w-4 h-4 text-gray-600 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
              <Link
                href="/customer/dashboard/create-job"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
              >
                <Plus className="w-4 h-4" />
                New Job
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatCard
              label="Open"
              value={stats.open}
              icon={AlertCircle}
              color="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              icon={Clock}
              color="bg-amber-100 text-amber-600"
            />
            <StatCard
              label="Applications"
              value={stats.totalApplications}
              icon={Users}
              color="bg-purple-100 text-purple-600"
            />
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition ${
                filter !== "all"
                  ? "bg-purple-50 border-purple-200 text-purple-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Chips */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {(
                [
                  "all",
                  "open",
                  "assigned",
                  "in_progress",
                  "completed",
                  "cancelled",
                ] as FilterType[]
              ).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                    filter === f
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? "All" : f.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-4 py-4">
        {filteredJobs.length > 0 ? (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const statusConfig = getStatusConfig(job.status);
              const StatusIcon = statusConfig.icon;
              const applicationsCount = job.applications?.[0]?.count || 0;

              return (
                <Link
                  key={job.id}
                  href={`/customer/dashboard/my-jobs/${job.id}`}
                  className="block bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="p-4">
                    {/* Header with status and date */}
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}
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
                      <span className="text-xs text-gray-400">
                        {formatDate(job.created_at)}
                      </span>
                    </div>

                    {/* Title and Price */}
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-base font-semibold text-gray-900 line-clamp-1 flex-1">
                        {job.title}
                      </h2>
                      <span className="text-lg font-bold text-gray-900 ml-2">
                        {formatPrice(job)}
                      </span>
                    </div>

                    {/* Location and Date */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{job.location || "Location TBD"}</span>
                      </div>
                      {job.date && (
                        <>
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(job.date).toLocaleDateString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Description Preview */}
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {job.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {job.category}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {job.level_required || "Any level"}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-0.5">
                        <Zap className="w-3 h-3" />
                        {job.urgency || "Flexible"}
                      </span>
                    </div>

                    {/* Footer with applications count and actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {applicationsCount}
                          </span>
                          <span className="text-gray-500">applicants</span>
                        </div>
                        {job.worker_id && (
                          <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <div className="flex items-center gap-1 text-purple-600">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Chat</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-purple-600">
                        <span className="text-xs font-medium">View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">
              No jobs found
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || filter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by posting your first job"}
            </p>
            {(searchTerm || filter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                }}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium mb-4 block"
              >
                Clear filters
              </button>
            )}
            <Link
              href="/customer/dashboard/create-job"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
            >
              <Plus className="w-4 h-4" />
              Post a Job
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
