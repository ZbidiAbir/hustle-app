"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  DollarSign,
  MessageSquare,
  ChevronRight,
  Loader2,
  Filter,
  Search,
  User,
  Calendar,
  Trash2,
  AlertCircle,
} from "lucide-react";

type Application = {
  id: string;
  job_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  job: {
    id: string;
    title: string;
    category: string;
    price: number;
    location: string;
    status: string;
    customer_id: string;
  };
  customer?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
};

type FilterType = "all" | "pending" | "accepted" | "rejected";

export default function WorkerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;

        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch applications with job details
        const { data, error } = await supabase
          .from("applications")
          .select(
            `
          *,
          job:jobs!inner(
            id,
            title,
            category,
            price,
            location,
            status,
            customer_id
          )
        `
          )
          .eq("worker_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch customer profiles for each job
        const customerIds = data?.map((app) => app.job.customer_id) || [];
        const { data: customersData } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", customerIds);

        const customersMap = new Map(
          customersData?.map((c) => [c.id, c]) || []
        );

        const applicationsWithCustomers = (data || []).map((app) => ({
          ...app,
          customer: customersMap.get(app.job.customer_id),
        }));

        setApplications(applicationsWithCustomers);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [router]
  );

  const handleWithdraw = useCallback(
    async (applicationId: string) => {
      if (!confirm("Are you sure you want to withdraw this application?")) {
        return;
      }

      try {
        const { error } = await supabase
          .from("applications")
          .delete()
          .eq("id", applicationId);

        if (error) throw error;

        alert("✅ Application withdrawn successfully");
        fetchApplications(true);
      } catch (error: any) {
        alert(`❌ Error: ${error.message}`);
      }
    },
    [fetchApplications]
  );

  // Filtered applications based on status and search
  const filteredApplications = useMemo(() => {
    let filtered = [...applications];

    // Filter by status
    if (filter !== "all") {
      filtered = filtered.filter((app) => app.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.job.title.toLowerCase().includes(term) ||
          app.job.category.toLowerCase().includes(term) ||
          app.job.location.toLowerCase().includes(term) ||
          app.customer?.full_name?.toLowerCase().includes(term) ||
          app.message?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [applications, filter, searchTerm]);

  // Stats
  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    }),
    [applications]
  );

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        text: "Pending",
        bg: "bg-yellow-50",
        textColor: "text-yellow-700",
        border: "border-yellow-200",
        iconColor: "text-yellow-500",
        dot: "bg-yellow-500",
      },
      accepted: {
        icon: CheckCircle,
        text: "Accepted",
        bg: "bg-green-50",
        textColor: "text-green-700",
        border: "border-green-200",
        iconColor: "text-green-500",
        dot: "bg-green-500",
      },
      rejected: {
        icon: XCircle,
        text: "Rejected",
        bg: "bg-red-50",
        textColor: "text-red-700",
        border: "border-red-200",
        iconColor: "text-red-500",
        dot: "bg-red-500",
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
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

  const getAvatarColor = (id: string) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-red-500 to-red-600",
      "from-yellow-500 to-yellow-600",
      "from-pink-500 to-pink-600",
      "from-indigo-500 to-indigo-600",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading applications...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">
                My Applications
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {stats.total} total · {stats.pending} pending
              </p>
            </div>
            <button
              onClick={() => fetchApplications(true)}
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

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={Clock}
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard
              label="Accepted"
              value={stats.accepted}
              icon={CheckCircle}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              icon={XCircle}
              color="bg-red-100 text-red-600"
            />
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition ${
                showFilters || filter !== "all" || searchTerm
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Chips */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {(["all", "pending", "accepted", "rejected"] as FilterType[]).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                      filter === f
                        ? f === "all"
                          ? "bg-blue-600 text-white"
                          : f === "pending"
                          ? "bg-yellow-600 text-white"
                          : f === "accepted"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {f === "all"
                      ? "All"
                      : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div className="px-4 py-4">
        {filteredApplications.length > 0 ? (
          <div className="space-y-3">
            {filteredApplications.map((app) => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={app.id}
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
                          {formatDate(app.created_at)}
                        </span>
                      </div>

                      {app.status === "pending" && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Withdraw application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Job Info */}
                    <div className="mb-3">
                      <Link
                        href={`/worker/dashboard//job/${app.job_id}`}
                        className="block hover:underline"
                      >
                        <h2 className="text-base font-semibold text-gray-900 mb-1">
                          {app.job.title}
                        </h2>
                      </Link>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {app.job.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>${app.job.price}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{app.job.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    {app.customer && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {/* Customer Avatar */}
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-r ${getAvatarColor(
                              app.job.customer_id
                            )} flex items-center justify-center text-white text-xs font-medium shadow-sm`}
                          >
                            {app.customer.full_name?.charAt(0).toUpperCase() ||
                              "C"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {app.customer.full_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {app.customer.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Application Message */}
                    {app.message && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-2 border-blue-500">
                        <p className="text-xs text-gray-600 italic">
                          "{app.message}"
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/worker/dashboard/chat/${app.job_id}`}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                      </Link>
                      <Link
                        href={`/worker/dashboard/job/${app.job_id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-4 h-4" />
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
              No applications found
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || filter !== "all"
                ? "Try adjusting your filters"
                : "You haven't applied to any jobs yet"}
            </p>
            {(searchTerm || filter !== "all") && (
              <button
                onClick={() => {
                  setFilter("all");
                  setSearchTerm("");
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium block mb-4"
              >
                Clear filters
              </button>
            )}
            <Link
              href="/worker/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Browse Jobs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
