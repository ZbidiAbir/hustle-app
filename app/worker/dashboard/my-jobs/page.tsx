"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Mail,
  MessageSquare,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Clock,
  Star,
  Image as ImageIcon,
  Eye,
  MoreHorizontal,
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  images: string[];
  customer_id: string;
  customer?: {
    full_name: string;
    email: string;
    avatar_url?: string;
    rating?: number;
  };
};

export default function WorkerMyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const router = useRouter();

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;

        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch jobs assigned to this worker
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("worker_id", user.id)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;

        // Fetch customer profiles for each job
        const customerIds = jobsData?.map((job) => job.customer_id) || [];
        const { data: customersData } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", customerIds);

        const customersMap = new Map(
          customersData?.map((c) => [c.id, c]) || []
        );

        const jobsWithCustomers = (jobsData || []).map((job) => ({
          ...job,
          customer: {
            ...customersMap.get(job.customer_id),
            full_name: customersMap.get(job.customer_id)?.full_name || "Client",
            email: customersMap.get(job.customer_id)?.email || "",
            rating: 4.8, // This would come from a reviews table in production
          },
        }));

        setJobs(jobsWithCustomers);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [router]
  );

  const updateJobStatus = useCallback(
    async (jobId: string, newStatus: string) => {
      try {
        const { error } = await supabase
          .from("jobs")
          .update({ status: newStatus })
          .eq("id", jobId);

        if (error) throw error;

        // Update local state
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, status: newStatus as Job["status"] }
              : job
          )
        );

        alert(
          `✅ Mission ${newStatus === "in_progress" ? "started" : "completed"}!`
        );
      } catch (error: any) {
        alert(`❌ Error: ${error.message}`);
      }
    },
    []
  );

  // Filter jobs based on selected filter
  const filteredJobs = useMemo(() => {
    if (filter === "all") return jobs;
    if (filter === "active") {
      return jobs.filter(
        (job) => job.status === "assigned" || job.status === "in_progress"
      );
    }
    if (filter === "completed") {
      return jobs.filter((job) => job.status === "completed");
    }
    return jobs;
  }, [jobs, filter]);

  // Stats
  const stats = useMemo(
    () => ({
      total: jobs.length,
      active: jobs.filter(
        (j) => j.status === "assigned" || j.status === "in_progress"
      ).length,
      completed: jobs.filter((j) => j.status === "completed").length,
      totalEarnings: jobs
        .filter((j) => j.status === "completed")
        .reduce((sum, j) => sum + j.price, 0),
    }),
    [jobs]
  );

  const getStatusConfig = (status: string) => {
    const configs = {
      assigned: {
        icon: Clock,
        text: "To Start",
        bg: "bg-blue-50",
        textColor: "text-blue-700",
        border: "border-blue-200",
        iconColor: "text-blue-500",
        dot: "bg-blue-500",
        action: "Start",
        actionColor: "yellow",
      },
      in_progress: {
        icon: Play,
        text: "In Progress",
        bg: "bg-yellow-50",
        textColor: "text-yellow-700",
        border: "border-yellow-200",
        iconColor: "text-yellow-500",
        dot: "bg-yellow-500",
        action: "Complete",
        actionColor: "green",
      },
      completed: {
        icon: CheckCircle,
        text: "Completed",
        bg: "bg-green-50",
        textColor: "text-green-700",
        border: "border-green-200",
        iconColor: "text-green-500",
        dot: "bg-green-500",
      },
      cancelled: {
        icon: XCircle,
        text: "Cancelled",
        bg: "bg-red-50",
        textColor: "text-red-700",
        border: "border-red-200",
        iconColor: "text-red-500",
        dot: "bg-red-500",
      },
    };
    return configs[status as keyof typeof configs] || configs.assigned;
  };

  const formatDate = useCallback((dateString: string) => {
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
  }, []);

  const getAvatarColor = useCallback((id: string) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-red-500 to-red-600",
      "from-yellow-500 to-yellow-600",
      "from-pink-500 to-pink-600",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  }, []);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
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
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">My Jobs</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {stats.total} total · {stats.active} active
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
                href="/worker/jobs"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                <Briefcase className="w-4 h-4" />
                Browse Jobs
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatCard
              label="Active Jobs"
              value={stats.active}
              icon={Play}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircle}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              label="Earnings"
              value={`$${stats.totalEarnings}`}
              icon={DollarSign}
              color="bg-purple-100 text-purple-600"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-4 py-4">
        {filteredJobs.length > 0 ? (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const statusConfig = getStatusConfig(job.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Status Bar */}
                  <div className={`h-1.5 ${statusConfig.bg}`} />

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}
                        >
                          <StatusIcon
                            className={`w-3 h-3 ${statusConfig.iconColor}`}
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
                    </div>

                    {/* Title and Price */}
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-base font-semibold text-gray-900 line-clamp-1 flex-1">
                        {job.title}
                      </h2>
                      <span className="text-lg font-bold text-green-600 ml-2">
                        ${job.price}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{job.location}</span>
                    </div>

                    {/* Customer Info */}
                    {job.customer && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {/* Customer Avatar */}
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-r ${getAvatarColor(
                              job.customer_id
                            )} flex items-center justify-center text-white text-xs font-medium shadow-sm`}
                          >
                            {job.customer.full_name?.charAt(0).toUpperCase() ||
                              "C"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {job.customer.full_name}
                              </p>
                              <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600">
                                  {job.customer.rating}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {job.customer.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Images Preview */}
                    {job.images && job.images.length > 0 && (
                      <div className="mb-3">
                        <div className="flex gap-2">
                          {job.images.slice(0, 3).map((img, idx) => (
                            <div
                              key={idx}
                              className="relative group cursor-pointer"
                              onClick={() => setSelectedImage(img)}
                            >
                              <img
                                src={img}
                                alt={`Job photo ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200 group-hover:opacity-90 transition"
                              />
                              {idx === 2 && job.images.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">
                                    +{job.images.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                      <Link
                        href={`/worker/dashboard/chat/${job.id}`}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                      </Link>

                      {job.status === "assigned" && (
                        <button
                          onClick={() => updateJobStatus(job.id, "in_progress")}
                          className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-4 h-4" />
                          Start
                        </button>
                      )}

                      {job.status === "in_progress" && (
                        <button
                          onClick={() => updateJobStatus(job.id, "completed")}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Complete
                        </button>
                      )}

                      <Link
                        href={`/worker/dashboard/job/${job.id}`}
                        className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Details</span>
                      </Link>
                    </div>
                  </div>
                </div>
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
              {filter !== "all"
                ? `You don't have any ${filter} jobs`
                : "You haven't been assigned to any jobs yet"}
            </p>
            <Link
              href="/worker/dashboard/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Browse Available Jobs
            </Link>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
