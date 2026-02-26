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
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  status:
    | "open"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "reported";
  created_at: string;
  customer_id: string;
  worker_id?: string;
  customer?: {
    full_name: string;
    email: string;
  };
  worker?: {
    full_name: string;
    email: string;
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
  const fetchJobs = async () => {
    try {
      setLoading(true);

      // Récupérer les jobs d'abord
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      // Récupérer les profils des clients et workers séparément
      const customerIds =
        jobsData?.map((j) => j.customer_id).filter(Boolean) || [];
      const workerIds = jobsData?.map((j) => j.worker_id).filter(Boolean) || [];
      const allIds = [...new Set([...customerIds, ...workerIds])];

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", allIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      // Enrichir les jobs avec les infos des profils
      const jobsWithDetails = (jobsData || []).map((job) => ({
        ...job,
        customer: profilesMap.get(job.customer_id),
        worker: job.worker_id ? profilesMap.get(job.worker_id) : null,
      }));

      // Récupérer le nombre d'applications pour chaque job
      const jobsWithCounts = await Promise.all(
        jobsWithDetails.map(async (job) => {
          const { count } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id);

          return {
            ...job,
            applications_count: count || 0,
          };
        })
      );

      setJobs(jobsWithCounts);

      // Extraire les catégories uniques
      const uniqueCategories = [
        ...new Set(jobsWithCounts.map((j) => j.category).filter(Boolean)),
      ];
      setCategories(uniqueCategories);

      // Calculer les statistiques
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

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(term) ||
          job.description?.toLowerCase().includes(term) ||
          job.category?.toLowerCase().includes(term) ||
          job.location?.toLowerCase().includes(term) ||
          job.customer?.full_name?.toLowerCase().includes(term) ||
          job.worker?.full_name?.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Filtre par catégorie
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

      // Mettre à jour l'état local
      setJobs(
        jobs.map((j) =>
          j.id === jobId ? { ...j, status: newStatus as any } : j
        )
      );

      // Si c'est une action de suppression, on peut recharger les données
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
      // Implémenter les actions groupées
      for (const jobId of selectedJobs) {
        await handleStatusChange(jobId, action);
      }

      setSelectedJobs([]);
      setSelectAll(false);
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err);
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
      open: "bg-green-100 text-green-800",
      assigned: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-gray-100 text-gray-800",
      reported: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
          <p className="text-gray-600 mt-1">Manage all jobs on the platform</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchJobs}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={stats.total}
          icon={Briefcase}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Open Jobs"
          value={stats.open}
          icon={Briefcase}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          title="Reported"
          value={stats.reported}
          icon={AlertTriangle}
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Value"
          value={`$${stats.totalValue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Assigned"
          value={stats.assigned}
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon={XCircle}
          color="bg-gray-100 text-gray-600"
        />
      </div>

      {/* Bulk Actions */}
      {selectedJobs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-red-700">
            <strong>{selectedJobs.length}</strong> job(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("completed")}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
            >
              Mark Completed
            </button>
            <button
              onClick={() => handleBulkAction("cancelled")}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleBulkAction("deleted")}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by title, category, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition ${
              showFilters || statusFilter !== "all" || categoryFilter !== "all"
                ? "bg-red-50 border-red-200 text-red-600"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(statusFilter !== "all" || categoryFilter !== "all") && (
              <span className="w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                {(statusFilter !== "all" ? 1 : 0) +
                  (categoryFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Export Button */}
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Download className="w-4 h-4 text-gray-600" />
            Export
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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

      {/* Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Job
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Worker
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Applications
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job.id)}
                      onChange={() => handleSelectJob(job.id)}
                      className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {job.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {job.location}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {job.customer ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {job.customer.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {job.customer.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {job.worker ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {job.worker.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {job.worker.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Not assigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {job.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">
                      ${job.price}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                    {job.status === "reported" &&
                      job.reported_count &&
                      job.reported_count > 0 && (
                        <span className="ml-2 text-xs text-red-600">
                          ({job.reported_count})
                        </span>
                      )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {job.applications_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(job.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="p-1 hover:bg-gray-100 rounded-lg transition"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </Link>
                      <div className="relative group">
                        <button className="p-1 hover:bg-gray-100 rounded-lg transition">
                          <MoreHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border hidden group-hover:block z-10">
                          {job.status !== "completed" && (
                            <button
                              onClick={() =>
                                handleStatusChange(job.id, "completed")
                              }
                              className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="w-4 h-4 inline mr-2" />
                              Mark Completed
                            </button>
                          )}
                          {job.status !== "cancelled" && (
                            <button
                              onClick={() =>
                                handleStatusChange(job.id, "cancelled")
                              }
                              className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                              <XCircle className="w-4 h-4 inline mr-2" />
                              Cancel Job
                            </button>
                          )}
                          {job.status !== "reported" && (
                            <button
                              onClick={() =>
                                handleStatusChange(job.id, "reported")
                              }
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <AlertTriangle className="w-4 h-4 inline mr-2" />
                              Report Job
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleStatusChange(job.id, "deleted")
                            }
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 inline mr-2" />
                            Delete Job
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "No jobs have been posted yet"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{filteredJobs.length}</span> of{" "}
              <span className="font-medium">{filteredJobs.length}</span> jobs
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Previous
              </button>
              <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                1
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
