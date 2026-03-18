"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  User,
  Mail,
  Phone,
  Star,
  Award,
  MessageSquare,
  AlertCircle,
  Ban,
  Check,
  Hourglass,
} from "lucide-react";

type Application = {
  id: string;
  job_id: string;
  worker_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at?: string;
  job?: {
    id: string;
    title: string;
    category: string;
    price?: number;
    fixed_rate?: number;
    min_rate?: number;
    max_rate?: number;
    hourly_rate?: number;
    pay_type?: string;
    location: string;
    status: string;
    customer_id: string;
    customer?: {
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
      phone?: string;
    };
  };
  worker?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
    job_title?: string;
    trade_category?: string;
    skills?: string[];
    level?: string;
    hourly_rate?: number;
    rating?: number;
    jobs_completed?: number;
    business_verified?: boolean;
  };
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<string[]>(
    []
  );
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    uniqueWorkers: 0,
    uniqueJobs: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, jobFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredApplications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      // 1. Récupérer toutes les applications
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;

      if (!appsData?.length) {
        setApplications([]);
        return;
      }

      // 2. Récupérer les IDs uniques des jobs et workers
      const jobIds = [...new Set(appsData.map((app) => app.job_id))];
      const workerIds = [...new Set(appsData.map((app) => app.worker_id))];

      // 3. Récupérer les détails des jobs
      const { data: jobsData } = await supabase
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
          status,
          customer_id
        `
        )
        .in("id", jobIds);

      // 4. Récupérer les profils des workers
      const { data: workersData } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          email,
          avatar_url,
          phone,
          job_title,
          trade_category,
          skills,
          level,
          hourly_rate,
          business_verified
        `
        )
        .in("id", workerIds);

      // 5. Récupérer les clients (propriétaires des jobs)
      const customerIds = [
        ...new Set(jobsData?.map((job) => job.customer_id) || []),
      ];
      const { data: customersData } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, phone")
        .in("id", customerIds);

      // Créer des maps pour un accès rapide
      const jobsMap = new Map(jobsData?.map((job) => [job.id, job]) || []);
      const workersMap = new Map(
        workersData?.map((worker) => [worker.id, worker]) || []
      );
      const customersMap = new Map(
        customersData?.map((customer) => [customer.id, customer]) || []
      );

      // 6. Combiner les données
      const applicationsWithDetails = appsData.map((app) => {
        const job = jobsMap.get(app.job_id);
        return {
          ...app,
          job: job
            ? {
                ...job,
                customer: job.customer_id
                  ? customersMap.get(job.customer_id)
                  : undefined,
              }
            : undefined,
          worker: workersMap.get(app.worker_id),
        };
      });

      setApplications(applicationsWithDetails);

      // Mettre à jour la liste des jobs pour les filtres
      const uniqueJobs =
        jobsData?.map((job) => ({ id: job.id, title: job.title })) || [];
      setJobs(uniqueJobs);

      // Calculer les statistiques
      const pending = applicationsWithDetails.filter(
        (a) => a.status === "pending"
      ).length;
      const accepted = applicationsWithDetails.filter(
        (a) => a.status === "accepted"
      ).length;
      const rejected = applicationsWithDetails.filter(
        (a) => a.status === "rejected"
      ).length;
      const uniqueWorkers = new Set(
        applicationsWithDetails.map((a) => a.worker_id)
      ).size;
      const uniqueJobsCount = new Set(
        applicationsWithDetails.map((a) => a.job_id)
      ).size;

      setStats({
        total: applicationsWithDetails.length,
        pending,
        accepted,
        rejected,
        uniqueWorkers,
        uniqueJobs: uniqueJobsCount,
      });
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.job?.title?.toLowerCase().includes(term) ||
          app.job?.category?.toLowerCase().includes(term) ||
          app.worker?.full_name?.toLowerCase().includes(term) ||
          app.worker?.email?.toLowerCase().includes(term) ||
          app.worker?.job_title?.toLowerCase().includes(term) ||
          app.message?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (jobFilter !== "all") {
      filtered = filtered.filter((app) => app.job_id === jobFilter);
    }

    setFilteredApplications(filtered);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map((a) => a.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectApplication = (appId: string) => {
    if (selectedApplications.includes(appId)) {
      setSelectedApplications(
        selectedApplications.filter((id) => id !== appId)
      );
      setSelectAll(false);
    } else {
      setSelectedApplications([...selectedApplications, appId]);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appId);

      if (error) throw error;

      // Mettre à jour l'état local
      setApplications(
        applications.map((app) =>
          app.id === appId ? { ...app, status: newStatus as any } : app
        )
      );

      // Mettre à jour les statistiques
      const pending = applications.filter((a) => a.status === "pending").length;
      const accepted = applications.filter(
        (a) => a.status === "accepted"
      ).length;
      const rejected = applications.filter(
        (a) => a.status === "rejected"
      ).length;

      setStats((prev) => ({
        ...prev,
        pending:
          newStatus === "pending"
            ? prev.pending + 1
            : //@ts-ignore

            prev.status === "pending"
            ? prev.pending - 1
            : prev.pending,
        accepted:
          newStatus === "accepted"
            ? //@ts-ignore

              prev.accepted + 1
            : //@ts-ignore

            prev.status === "accepted"
            ? prev.accepted - 1
            : prev.accepted,
        rejected:
          newStatus === "rejected"
            ? prev.rejected + 1
            : //@ts-ignore

            prev.status === "rejected"
            ? prev.rejected - 1
            : prev.rejected,
      }));
    } catch (err) {
      console.error("Error changing application status:", err);
      alert("Failed to update application status");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedApplications.length === 0) return;

    const confirmMessage = `Are you sure you want to ${action} ${selectedApplications.length} application(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      for (const appId of selectedApplications) {
        await handleStatusChange(appId, action);
      }
      setSelectedApplications([]);
      setSelectAll(false);
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err);
    }
  };

  const formatPrice = (application: Application) => {
    const job = application.job;
    if (!job) return "$0";

    switch (job.pay_type) {
      case "Fixed":
        return job.fixed_rate
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
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
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} min ago`;
      }
      return `${diffHours} hour ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        iconColor: "text-amber-500",
        label: "Pending",
      },
      accepted: {
        icon: CheckCircle,
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        iconColor: "text-emerald-500",
        label: "Accepted",
      },
      rejected: {
        icon: XCircle,
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        iconColor: "text-rose-500",
        label: "Rejected",
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
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
      "bg-emerald-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  };

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Applications Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage all job applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Applications"
            value={stats.total}
            icon={FileText}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Pending Review"
            value={stats.pending}
            icon={Hourglass}
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            title="Accepted"
            value={stats.accepted}
            icon={CheckCircle}
            color="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            color="bg-rose-100 text-rose-600"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Unique Workers</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                {stats.uniqueWorkers}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <span className="text-sm text-gray-600">Unique Jobs</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                {stats.uniqueJobs}
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title, worker name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition ${
                  showFilters || statusFilter !== "all" || jobFilter !== "all"
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(statusFilter !== "all" || jobFilter !== "all") && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {(statusFilter !== "all" ? 1 : 0) +
                      (jobFilter !== "all" ? 1 : 0)}
                  </span>
                )}
              </button>
              <button
                onClick={fetchApplications}
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
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Job
                </label>
                <select
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Jobs</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-blue-700">
              <strong>{selectedApplications.length}</strong> application(s)
              selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("accepted")}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Accept
              </button>
              <button
                onClick={() => handleBulkAction("rejected")}
                className="px-3 py-1.5 bg-rose-600 text-white text-xs rounded-lg hover:bg-rose-700 transition flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                Reject
              </button>
              <button
                onClick={() => setSelectedApplications([])}
                className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Applications Table */}
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
                    Worker
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
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
                {paginatedApplications.map((app) => {
                  const statusConfig = getStatusConfig(app.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(app.id)}
                          onChange={() => handleSelectApplication(app.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full ${getAvatarColor(
                              app.worker_id
                            )} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}
                          >
                            {app.worker?.avatar_url ? (
                              <img
                                src={app.worker.avatar_url}
                                alt={app.worker.full_name || ""}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(
                                //@ts-ignore
                                app.worker?.full_name
                              )
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {app.worker?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {app.worker?.job_title ||
                                app.worker?.trade_category ||
                                "Worker"}
                            </p>
                            {app.worker?.business_verified && (
                              <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {app.job?.title || "Unknown Job"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {app.job?.category}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {app.job?.customer ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full ${getAvatarColor(
                                app.job.customer.id
                              )} flex items-center justify-center text-white text-xs font-medium`}
                            >
                              {app.job.customer.avatar_url ? (
                                <img
                                  src={app.job.customer.avatar_url}
                                  alt={app.job.customer.full_name || ""}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                getInitials(app.job.customer.full_name)
                              )}
                            </div>
                            <span className="text-sm text-gray-900">
                              {app.job.customer.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {formatPrice(app)}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {app.message ? (
                          <p
                            className="text-sm text-gray-600 truncate"
                            title={app.message}
                          >
                            "{app.message}"
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No message
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(app.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <StatusIcon
                            className={`w-3 h-3 ${statusConfig.iconColor}`}
                          />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Link>
                          <Link
                            href={`/admin/messages?job=${app.job_id}&worker=${app.worker_id}`}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                            title="View conversation"
                          >
                            <MessageSquare className="w-4 h-4 text-gray-500" />
                          </Link>
                          <div className="relative group">
                            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                              <div className="py-1">
                                {app.status !== "accepted" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(app.id, "accepted")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Accept Application
                                  </button>
                                )}
                                {app.status !== "rejected" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(app.id, "rejected")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject Application
                                  </button>
                                )}
                                {app.status !== "pending" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(app.id, "pending")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                  >
                                    <Clock className="w-4 h-4" />
                                    Mark Pending
                                  </button>
                                )}
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
          {filteredApplications.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">
                No applications found
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm || statusFilter !== "all" || jobFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No applications have been submitted yet"}
              </p>
              {(searchTerm ||
                statusFilter !== "all" ||
                jobFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setJobFilter("all");
                  }}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredApplications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredApplications.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {filteredApplications.length}
                </span>{" "}
                applications
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
