"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Download,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Home,
  Building2,
  User,
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  min_rate?: number;
  max_rate?: number;
  location: string;
  status:
    | "open"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "reported";
  created_at: string;
  scheduled_date?: string;
  customer_id: string;
  worker_id?: string;
  customer?: {
    full_name: string;
    email: string;
    avatar_url?: string;
    type?: "homeowner" | "business";
  };
  worker?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  applications_count?: number;
  reported_count?: number;
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    reported: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredJobs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      const customerIds =
        jobsData?.map((j) => j.customer_id).filter(Boolean) || [];
      const workerIds = jobsData?.map((j) => j.worker_id).filter(Boolean) || [];
      const allIds = [...new Set([...customerIds, ...workerIds])];

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", allIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      const jobsWithDetails = (jobsData || []).map((job) => ({
        ...job,
        customer: profilesMap.get(job.customer_id),
        worker: job.worker_id ? profilesMap.get(job.worker_id) : null,
      }));

      const jobsWithCounts = await Promise.all(
        jobsWithDetails.map(async (job) => {
          const { count } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id);

          const scheduledDate = new Date(job.created_at);
          scheduledDate.setDate(scheduledDate.getDate() + 3);

          return {
            ...job,
            applications_count: count || 0,
            scheduled_date: scheduledDate.toISOString(),
            customer_type: Math.random() > 0.5 ? "homeowner" : "business",
          };
        })
      );

      setJobs(jobsWithCounts);

      const uniqueCategories = [
        ...new Set(jobsWithCounts.map((j) => j.category).filter(Boolean)),
      ];
      setCategories(uniqueCategories);

      setStats({
        total: jobsWithCounts.length,
        open: jobsWithCounts.filter((j) => j.status === "open").length,
        assigned: jobsWithCounts.filter((j) => j.status === "assigned").length,
        inProgress: jobsWithCounts.filter((j) => j.status === "in_progress")
          .length,
        completed: jobsWithCounts.filter((j) => j.status === "completed")
          .length,
        cancelled: jobsWithCounts.filter((j) => j.status === "cancelled")
          .length,
        reported: jobsWithCounts.filter((j) => j.status === "reported").length,
        totalValue: jobsWithCounts.reduce((sum, j) => sum + (j.price || 0), 0),
      });
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.id?.toLowerCase().includes(term) ||
          job.title?.toLowerCase().includes(term) ||
          job.category?.toLowerCase().includes(term) ||
          job.location?.toLowerCase().includes(term) ||
          job.customer?.full_name?.toLowerCase().includes(term) ||
          job.worker?.full_name?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((job) => job.category === categoryFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map((j) => j.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectJob = (jobId: string) => {
    if (selectedJobs.includes(jobId)) {
      setSelectedJobs(selectedJobs.filter((id) => id !== jobId));
      setSelectAll(false);
    } else {
      setSelectedJobs([...selectedJobs, jobId]);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (error) throw error;

      setJobs(
        jobs.map((j) =>
          j.id === jobId ? { ...j, status: newStatus as any } : j
        )
      );

      if (newStatus === "deleted") {
        fetchJobs();
      }
    } catch (err) {
      console.error("Error changing job status:", err);
      alert("Failed to update job status");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedJobs.length === 0) return;

    const confirmMessage = `Are you sure you want to ${action} ${selectedJobs.length} job(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      for (const jobId of selectedJobs) {
        await handleStatusChange(jobId, action);
      }
      setSelectedJobs([]);
      setSelectAll(false);
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err);
    }
  };

  const formatPrice = (job: Job) => {
    if (job.min_rate && job.max_rate) {
      return `$${job.min_rate.toLocaleString()} - $${job.max_rate.toLocaleString()}`;
    }
    if (job.price) {
      return `$${job.price.toLocaleString()}`;
    }
    return "$0";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: "bg-emerald-50 text-emerald-700 border-emerald-200",
      assigned: "bg-blue-50 text-blue-700 border-blue-200",
      in_progress: "bg-amber-50 text-amber-700 border-amber-200",
      completed: "bg-purple-50 text-purple-700 border-purple-200",
      cancelled: "bg-gray-50 text-gray-700 border-gray-200",
      reported: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Briefcase className="w-3 h-3" />;
      case "assigned":
        return <Users className="w-3 h-3" />;
      case "in_progress":
        return <Clock className="w-3 h-3" />;
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      case "reported":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Briefcase className="w-3 h-3" />;
    }
  };

  const getCustomerTypeIcon = (type?: string) => {
    if (type === "business") {
      return <Building2 className="w-3 h-3 text-gray-400" />;
    }
    return <Home className="w-3 h-3 text-gray-400" />;
  };

  const getCustomerTypeLabel = (type?: string) => {
    return type === "business" ? "Small Business" : "Homeowner";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  };

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend > 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 ">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Job management</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Job open</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Job open</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Jobs"
            value={stats.total}
            icon={Briefcase}
            color="bg-blue-100 text-blue-600"
            trend={12}
          />
          <StatCard
            title="Open Jobs"
            value={stats.open}
            icon={Briefcase}
            color="bg-emerald-100 text-emerald-600"
            trend={8}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={Clock}
            color="bg-amber-100 text-amber-600"
            trend={-3}
          />
          <StatCard
            title="Total Value"
            value={`$${(stats.totalValue / 1000).toFixed(1)}K`}
            icon={DollarSign}
            color="bg-purple-100 text-purple-600"
            trend={15}
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by ID, title, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition ${
                  showFilters ||
                  statusFilter !== "all" ||
                  categoryFilter !== "all"
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(statusFilter !== "all" || categoryFilter !== "all") && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {(statusFilter !== "all" ? 1 : 0) +
                      (categoryFilter !== "all" ? 1 : 0)}
                  </span>
                )}
              </button>
              <button
                onClick={fetchJobs}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
              <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="reported">Reported</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-blue-700">
              <strong>{selectedJobs.length}</strong> job(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("completed")}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition"
              >
                Mark Completed
              </button>
              <button
                onClick={() => handleBulkAction("cancelled")}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs rounded-lg hover:bg-amber-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAction("deleted")}
                className="px-3 py-1.5 bg-rose-600 text-white text-xs rounded-lg hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Worker
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedJobs.map((job, index) => {
                  const jobNumber = 241 + index;
                  const statusColors = getStatusColor(job.status);
                  const StatusIcon = getStatusIcon(job.status);

                  return (
                    <tr key={job.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job.id)}
                          onChange={() => handleSelectJob(job.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        {jobNumber.toString().padStart(4, "0")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {job.title || "Job name goes here"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {job.category || "Job category"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Avatar ou Initiales */}
                          {job.customer?.avatar_url ? (
                            <img
                              src={job.customer.avatar_url}
                              alt={job.customer.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full ${getAvatarColor(
                                job.customer_id
                              )} flex items-center justify-center text-white text-xs font-medium`}
                            >
                              {getInitials(
                                job.customer?.full_name || "Unknown"
                              )}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {job.customer?.full_name || "Company name"}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {getCustomerTypeIcon(job.customer?.type)}
                              <span>
                                {getCustomerTypeLabel(job.customer?.type)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {job.worker ? (
                          <div className="flex items-center gap-2">
                            {/* Avatar ou Initiales pour le worker */}
                            {job.worker.avatar_url ? (
                              <img
                                src={job.worker.avatar_url}
                                alt={job.worker.full_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-full ${getAvatarColor(
                                  job.worker_id || ""
                                )} flex items-center justify-center text-white text-xs font-medium`}
                              >
                                {getInitials(job.worker.full_name)}
                              </div>
                            )}
                            <span className="text-sm text-gray-900">
                              {job.worker.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No applicants
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {job.location || "Brooklyn, NY"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(job)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(job.scheduled_date || job.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusColors}`}
                        >
                          {job.status === "open"
                            ? "Job Open"
                            : job.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/jobs/${job.id}`}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Link>
                          <div className="relative group">
                            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                              <div className="py-1">
                                <button
                                  onClick={() =>
                                    handleStatusChange(job.id, "completed")
                                  }
                                  className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                                >
                                  <CheckCircle className="w-4 h-4 inline mr-2" />
                                  Mark Completed
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(job.id, "cancelled")
                                  }
                                  className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                                >
                                  <XCircle className="w-4 h-4 inline mr-2" />
                                  Cancel Job
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(job.id, "reported")
                                  }
                                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                >
                                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                                  Report Job
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() =>
                                    handleStatusChange(job.id, "deleted")
                                  }
                                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-4 h-4 inline mr-2" />
                                  Delete Job
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">
                No jobs found
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm ||
                statusFilter !== "all" ||
                categoryFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No jobs have been posted yet"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredJobs.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredJobs.length)}
                </span>{" "}
                of <span className="font-medium">{filteredJobs.length}</span>{" "}
                jobs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 3 + i;
                    }
                  }
                  if (pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 text-sm rounded-lg ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
