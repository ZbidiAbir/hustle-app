"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Mail,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  User,
  AlertCircle,
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  status: string;
  created_at: string;
  customer_id: string;
  customer?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
};

type Application = {
  id: string;
  worker_id: string;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  created_at: string;
  worker?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
};

export default function JobApplicationsPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const params = useParams();
  const router = useRouter();

  const jobId = params?.id as string;

  useEffect(() => {
    if (!jobId || jobId === "undefined" || jobId === "null") {
      setError("Job ID is missing or invalid");
      setLoading(false);
      return;
    }

    fetchJobAndApplications();
  }, [jobId]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredApplications]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching job with ID:", jobId);

      // 1. Récupérer les détails du job
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) {
        console.error("❌ Job fetch error:", jobError);
        if (jobError.code === "PGRST116") {
          setError("Job not found");
        } else {
          throw jobError;
        }
        setLoading(false);
        return;
      }

      if (!jobData) {
        setError("Job not found");
        setLoading(false);
        return;
      }

      console.log("✅ Job data fetched:", jobData);

      // 2. Récupérer les infos du client
      const { data: customerData, error: customerError } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", jobData.customer_id)
        .maybeSingle();

      if (customerError) {
        console.error("⚠️ Customer fetch error:", customerError);
      }

      setJob({
        ...jobData,
        customer: customerData || undefined,
      });

      // 3. Récupérer les candidatures pour ce job
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select("id, worker_id, status, message, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (appsError) {
        console.error("⚠️ Applications fetch error:", appsError);
        setApplications([]);
      } else {
        console.log("✅ Applications fetched:", appsData);

        if (appsData && appsData.length > 0) {
          // 4. Récupérer les profils des workers pour chaque candidature
          const workerIds = appsData.map((app) => app.worker_id);
          console.log("👥 Worker IDs:", workerIds);

          const { data: workersData, error: workersError } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", workerIds);

          if (workersError) {
            console.error("⚠️ Workers fetch error:", workersError);
          }

          console.log("👤 Workers data:", workersData);

          // Créer un map des profils pour un accès facile
          const workersMap = new Map();
          workersData?.forEach((worker) => {
            workersMap.set(worker.id, worker);
          });

          // Combiner les données
          const appsWithWorkers = appsData.map((app) => {
            const worker = workersMap.get(app.worker_id);
            console.log(`🔍 App ${app.id} - Worker ${app.worker_id}:`, worker);

            return {
              ...app,
              worker: worker
                ? {
                    full_name: worker.full_name || "Unknown Worker",
                    email: worker.email || "No email",
                    avatar_url: worker.avatar_url,
                  }
                : {
                    full_name: "Unknown Worker",
                    email: "No email",
                  },
            };
          });

          console.log("✅ Apps with workers:", appsWithWorkers);
          setApplications(appsWithWorkers);
        } else {
          setApplications([]);
        }
      }
    } catch (err: any) {
      console.error("❌ Error fetching job details:", err);
      setError(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applications.length > 0) {
      setStats({
        total: applications.length,
        pending: applications.filter((a) => a.status === "pending").length,
        accepted: applications.filter((a) => a.status === "accepted").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
      });
    } else {
      setStats({
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
      });
    }
  }, [applications]);

  const filterApplications = () => {
    let filtered = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.worker?.full_name?.toLowerCase().includes(term) ||
          app.worker?.email?.toLowerCase().includes(term) ||
          app.message?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedApps([]);
    } else {
      setSelectedApps(filteredApplications.map((app) => app.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectApp = (appId: string) => {
    if (selectedApps.includes(appId)) {
      setSelectedApps(selectedApps.filter((id) => id !== appId));
      setSelectAll(false);
    } else {
      setSelectedApps([...selectedApps, appId]);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", appId);

      if (error) throw error;

      // Mettre à jour l'état local
      const updatedApplications = applications.map((app) =>
        app.id === appId ? { ...app, status: newStatus as any } : app
      );

      setApplications(updatedApplications);

      // Mettre à jour les stats
      setStats({
        total: updatedApplications.length,
        pending: updatedApplications.filter((a) => a.status === "pending")
          .length,
        accepted: updatedApplications.filter((a) => a.status === "accepted")
          .length,
        rejected: updatedApplications.filter((a) => a.status === "rejected")
          .length,
      });

      alert(`Application ${newStatus} successfully!`);
    } catch (err) {
      console.error("Error updating application:", err);
      alert("Failed to update application status");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedApps.length === 0) return;

    const confirmMessage = `Are you sure you want to ${action} ${selectedApps.length} application(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      for (const appId of selectedApps) {
        await handleStatusChange(appId, action);
      }
      setSelectedApps([]);
      setSelectAll(false);
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err);
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

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "accepted":
        return <CheckCircle className="w-3 h-3" />;
      case "rejected":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
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
  const paginatedApps = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${color}`}>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full p-6 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error || "Job Not Found"}
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            {error || "The job you're looking for doesn't exist."}
          </p>
          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          {/* Mobile Header */}
          <div className="flex items-center justify-between lg:hidden mb-3">
            <Link
              href={`/admin/jobs/${jobId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link
                href="/admin/jobs"
                className="hover:text-gray-700 transition"
              >
                Jobs
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link
                href={`/admin/jobs/${jobId}`}
                className="hover:text-gray-700 transition"
              >
                {job.title}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Applications</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Applications for "{job.title}"
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Job Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {job.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {job.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />${job.price}
                  </span>
                </div>
              </div>
              <Link
                href={`/admin/jobs/${jobId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm sm:text-base"
              >
                <Eye className="w-4 h-4" />
                View Job Details
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total Applications"
              value={stats.total}
              icon={Users}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={Clock}
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard
              title="Accepted"
              value={stats.accepted}
              icon={CheckCircle}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon={XCircle}
              color="bg-red-100 text-red-600"
            />
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by worker name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition ${
                    showFilters || statusFilter !== "all"
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {statusFilter !== "all" && (
                    <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      1
                    </span>
                  )}
                </button>
                <button
                  onClick={fetchJobAndApplications}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedApps.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-sm text-blue-700">
                <strong>{selectedApps.length}</strong> application(s) selected
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleBulkAction("accepted")}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleBulkAction("rejected")}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Applications Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
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
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedApps.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedApps.includes(app.id)}
                          onChange={() => handleSelectApp(app.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full ${getAvatarColor(
                              app.worker_id
                            )} flex items-center justify-center text-white text-xs font-medium`}
                          >
                            {app.worker?.avatar_url ? (
                              <img
                                src={app.worker.avatar_url}
                                alt={app.worker.full_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(app.worker?.full_name || "")
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {app.worker?.full_name || "Unknown Worker"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {app.worker?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {getStatusIcon(app.status)}
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {app.message ? (
                          <p className="text-sm text-gray-600 truncate max-w-xs">
                            "{app.message}"
                          </p>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            No message
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="p-1 hover:bg-gray-100 rounded-lg transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Link>
                          {app.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusChange(app.id, "accepted")
                                }
                                className="p-1 hover:bg-green-100 rounded-lg transition"
                                title="Accept"
                              >
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(app.id, "rejected")
                                }
                                className="p-1 hover:bg-red-100 rounded-lg transition"
                                title="Reject"
                              >
                                <ThumbsDown className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
                          <Link
                            href={`/admin/messages?worker=${app.worker_id}&job=${jobId}`}
                            className="p-1 hover:bg-gray-100 rounded-lg transition"
                            title="Message"
                          >
                            <MessageSquare className="w-4 h-4 text-gray-600" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {paginatedApps.map((app) => (
                <div key={app.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedApps.includes(app.id)}
                        onChange={() => handleSelectApp(app.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div
                        className={`w-10 h-10 rounded-full ${getAvatarColor(
                          app.worker_id
                        )} flex items-center justify-center text-white text-sm font-medium`}
                      >
                        {app.worker?.avatar_url ? (
                          <img
                            src={app.worker.avatar_url}
                            alt={app.worker.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(app.worker?.full_name || "")
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {app.worker?.full_name || "Unknown Worker"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {app.worker?.email || "No email"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {getStatusIcon(app.status)}
                      {app.status}
                    </span>
                  </div>

                  <div className="ml-13 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Applied {formatDate(app.created_at)}
                      </span>
                    </div>

                    {app.message && (
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded italic">
                        "{app.message}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition text-center"
                      >
                        View Details
                      </Link>
                      {app.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(app.id, "accepted")
                            }
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(app.id, "rejected")
                            }
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredApplications.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                  No applications found
                </h3>
                <p className="text-sm text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "No applications have been submitted for this job yet"}
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredApplications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
                <p className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
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
                <div className="flex items-center gap-2 order-1 sm:order-2">
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
    </div>
  );
}
