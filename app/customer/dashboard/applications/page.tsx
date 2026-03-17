"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  ChevronRight,
  Star,
  MapPin,
  DollarSign,
  MessageSquare,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";

type Application = {
  id: string;
  job_id: string;
  worker_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  job?: {
    id: string;
    title: string;
    category: string;
    price: number;
    location: string;
    status: string;
  };
  worker?: {
    full_name: string;
    email: string;
    avatar_url?: string;
    rating?: number;
    jobs_completed?: number;
    distance?: number;
  };
};

type FilterType = "all" | "pending" | "accepted" | "rejected";

type Stats = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
};

export default function AllApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Memoized filtered applications
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
          app.worker?.email?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [applications, searchTerm, statusFilter]);

  // Fetch applications
  const fetchAllApplications = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Parallel fetching of jobs and applications
        const [{ data: jobsData }, { data: appsData }] = await Promise.all([
          supabase
            .from("jobs")
            .select("id, title, category, price, location, status")
            .eq("customer_id", user.id),
          supabase
            .from("applications")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

        if (!jobsData?.length || !appsData?.length) {
          setApplications([]);
          setStats({ total: 0, pending: 0, accepted: 0, rejected: 0 });
          return;
        }

        // Filter applications for user's jobs
        const jobIds = new Set(jobsData.map((job) => job.id));
        const userApps = appsData.filter((app) => jobIds.has(app.job_id));

        if (!userApps.length) {
          setApplications([]);
          setStats({ total: 0, pending: 0, accepted: 0, rejected: 0 });
          return;
        }

        // Fetch worker profiles
        const workerIds = [...new Set(userApps.map((app) => app.worker_id))];
        const { data: workersData } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", workerIds);

        // Create maps for O(1) lookup
        const jobsMap = new Map(jobsData.map((job) => [job.id, job]));
        const workersMap = new Map(workersData?.map((w) => [w.id, w]) || []);

        // Combine data with mock ratings/distances
        const combinedData = userApps.map((app) => ({
          ...app,
          job: jobsMap.get(app.job_id),
          worker: {
            ...(workersMap.get(app.worker_id) || {
              full_name: "Unknown Worker",
              email: "unknown@email.com",
            }),
            rating: 4.5 + Math.random() * 0.5,
            jobs_completed: Math.floor(Math.random() * 150) + 20,
            distance: (Math.random() * 5).toFixed(1),
          },
        }));

        // Calculate stats
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
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchAllApplications();
  }, [fetchAllApplications]);

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        text: "Pending",
        bg: "bg-yellow-50",
        textColor: "text-yellow-700",
        border: "border-yellow-200",
        iconColor: "text-yellow-500",
      },
      accepted: {
        icon: CheckCircle,
        text: "Accepted",
        bg: "bg-green-50",
        textColor: "text-green-700",
        border: "border-green-200",
        iconColor: "text-green-500",
      },
      rejected: {
        icon: XCircle,
        text: "Rejected",
        bg: "bg-red-50",
        textColor: "text-red-700",
        border: "border-red-200",
        iconColor: "text-red-500",
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

  const StatCard = useCallback(({ title, value, icon: Icon, color }: any) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600",
      yellow: "bg-yellow-50 text-yellow-600",
      green: "bg-green-50 text-green-600",
      red: "bg-red-50 text-red-600",
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-3">
          <div
            className={`p-3 rounded-xl ${
              //@ts-ignore
              colors[color]
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    );
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with refresh */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage all job applications you've received
            </p>
          </div>
          <button
            onClick={() => fetchAllApplications(true)}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <Loader2
              className={`w-5 h-5 text-gray-600 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            title="Total"
            value={stats.total}
            icon={Users}
            color="blue"
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title or worker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterType)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.map((app) => {
            const statusConfig = getStatusConfig(app.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden group"
              >
                {/* Status Bar */}
                <div className={`h-1.5 ${statusConfig.bg}`} />

                <div className="p-5">
                  {/* Header with avatar and status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full to-pink-500 bg-gray-200 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        <img
                          src={app.worker?.avatar_url}
                          alt=""
                          className="rounded-full"
                        />{" "}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {app.worker?.full_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {app.worker?.email}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}
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
                  </div>

                  {/* Worker Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{app.worker?.rating?.toFixed(1)}</span>
                    </div>
                    <span>•</span>
                    <span>{app.worker?.jobs_completed} jobs</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{app.worker?.distance} km</span>
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-1">
                      {app.job?.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                        {app.job?.category}
                      </span>
                      <span className="font-medium text-gray-900">
                        ${app.job?.price}
                      </span>
                    </div>
                  </div>

                  {/* Proposal Preview */}
                  {app.message && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 italic">
                      "{app.message}"
                    </p>
                  )}

                  {/* Time and Rate */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Time window</p>
                      <p className="font-medium text-gray-900">Wed 2-4PM</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Rate</p>
                      <p className="font-medium text-gray-900">
                        $280{" "}
                        <span className="text-xs text-gray-500">+$100</span>
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/customer/dashboard/chat/${app.job_id}`}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Link>
                    <Link
                      href={`/customer/dashboard/applications/${app.id}`}
                      className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </Link>
                  </div>

                  {/* Application Date */}
                  <p className="text-xs text-gray-400 text-right mt-3">
                    Applied {formatDate(app.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredApplications.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No applications found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "When workers apply to your jobs, they will appear here"}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
