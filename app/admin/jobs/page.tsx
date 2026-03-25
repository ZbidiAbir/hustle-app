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
  price?: number;
  fixed_rate?: number;
  min_rate?: number;
  max_rate?: number;
  hourly_rate?: number;
  pay_type?: string;
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
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    account_type?: string;
  };
  worker?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  applications_count?: number;
  reported_count?: number;
  customer_type?: "homeowner" | "business";
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

      // Récupérer tous les jobs avec tous les champs de prix
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select(
          `
          id,
          title,
          description,
          category,
          price,
          fixed_rate,
          min_rate,
          max_rate,
          hourly_rate,
          pay_type,
          location,
          status,
          created_at,
          customer_id,
          worker_id
        `
        )
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      if (!jobsData) {
        setJobs([]);
        return;
      }

      // Récupérer les IDs uniques des clients et workers
      const customerIds = [
        ...new Set(jobsData.map((j) => j.customer_id).filter(Boolean)),
      ];
      const workerIds = [
        ...new Set(jobsData.map((j) => j.worker_id).filter(Boolean)),
      ];
      const allIds = [...new Set([...customerIds, ...workerIds])];

      // Récupérer les profils
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, account_type")
        .in("id", allIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      // Récupérer le nombre d'applications pour chaque job
      const jobsWithDetails = await Promise.all(
        jobsData.map(async (job) => {
          const { count } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id);

          // Déterminer le type de client (basé sur des données réelles si disponibles)
          const customerProfile = profilesMap.get(job.customer_id);
          const customerType = customerProfile?.account_type; //@ts-ignore

          return {
            ...job,
            customer: customerProfile,
            worker: job.worker_id ? profilesMap.get(job.worker_id) : null,
            applications_count: count || 0,
            customer_type: customerType,
          };
        })
      );

      setJobs(
        //@ts-ignore
        jobsWithDetails
      );

      // Extraire les catégories uniques
      const uniqueCategories = [
        ...new Set(jobsWithDetails.map((j) => j.category).filter(Boolean)),
      ];
      setCategories(uniqueCategories);

      // Calculer les statistiques
      const totalValue = jobsWithDetails.reduce((sum, job) => {
        if (job.pay_type === "Fixed" && job.fixed_rate) {
          return sum + job.fixed_rate;
        } else if (job.pay_type === "Hourly" && job.hourly_rate) {
          return sum + job.hourly_rate * 8; // Estimation 8h
        } else if (job.price) {
          return sum + job.price;
        }
        return sum;
      }, 0);

      setStats({
        total: jobsWithDetails.length,
        open: jobsWithDetails.filter((j) => j.status === "open").length,
        assigned: jobsWithDetails.filter((j) => j.status === "assigned").length,
        inProgress: jobsWithDetails.filter((j) => j.status === "in_progress")
          .length,
        completed: jobsWithDetails.filter((j) => j.status === "completed")
          .length,
        cancelled: jobsWithDetails.filter((j) => j.status === "cancelled")
          .length,
        reported: jobsWithDetails.filter((j) => j.status === "reported").length,
        totalValue: totalValue,
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
    if (!job) return "$0";

    switch (job.pay_type) {
      case "Fixed":
        return job.fixed_rate
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
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
      .slice(0, 2);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className=" space-y-6 ">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Job Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor all jobs on the platform
          </p>
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
            value={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(stats.totalValue)}
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
                onClick={() => setSelectedJobs([])}
                className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition"
              >
                Clear
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
                    Job Details
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
                    Created
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
                {paginatedJobs.map((job) => {
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
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {job.title || "Untitled Job"}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                            {job.category || "Uncategorized"}
                          </span>
                          {job.applications_count ? (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {job.applications_count} apps
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {job.customer ? (
                          <div className="flex items-center gap-2">
                            {job.customer.avatar_url ? (
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
                                {getInitials(job.customer.full_name || "U")}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {job.customer.full_name || "Unknown"}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {job.worker ? (
                          <div className="flex items-center gap-2">
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
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {job.location || "Location TBD"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(job)}
                        </span>
                        {job.pay_type && (
                          <span className="text-xs text-gray-400 block">
                            {job.pay_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(job.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusColors}`}
                        >
                          {job.status === "in_progress"
                            ? "In Progress"
                            : job.status.charAt(0).toUpperCase() +
                              job.status.slice(1)}
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
                          {/* <div className="relative group">
                            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                              <div className="py-1">
                                <button
                                  onClick={() =>
                                    handleStatusChange(job.id, "completed")
                                  }
                                  className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Mark Completed
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(job.id, "cancelled")
                                  }
                                  className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Cancel Job
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(job.id, "reported")
                                  }
                                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                  Report Job
                                </button>
                              </div>
                            </div>
                          </div> */}
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
              {(searchTerm ||
                statusFilter !== "all" ||
                categoryFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                  }}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
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
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
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
