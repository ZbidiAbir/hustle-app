"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  DollarSign,
  Calendar,
  Shield,
  Scale,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Star,
} from "lucide-react";
import { DisputeModal } from "./components/DisputeModal";

export type Dispute = {
  id: string;
  job_id: string;
  created_by: string;
  against_user: string;
  type:
    | "payment"
    | "quality"
    | "timeline"
    | "communication"
    | "safety"
    | "other";
  description: string;
  preferred_resolution: string;
  evidence: string[];
  status: "pending" | "under_review" | "resolved" | "dismissed";
  resolved_by: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DisputeWithDetails = Dispute & {
  job?: {
    id: string;
    title: string;
    description: string;
    budget: number;
    budget_type: string;
    status: string;
    location: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  created_by_user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
    role: string;
  };
  against_user_details?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
    role: string;
  };
  resolved_by_user?: {
    full_name: string;
    email: string;
  };
};

type FilterOptions = {
  type: string;
  status: string;
  dateRange: string;
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<
    DisputeWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] =
    useState<DisputeWithDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    status: "all",
    dateRange: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    under_review: 0,
    resolved: 0,
    dismissed: 0,
    payment: 0,
    quality: 0,
    timeline: 0,
    communication: 0,
    safety: 0,
    other: 0,
  });

  const router = useRouter();

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error checking auth:", error);
        router.push("/login");
        return;
      }

      if (!session) {
        console.log("No active session, redirecting to login");
        router.push("/login");
        return;
      }

      // Vérifier que l'utilisateur existe et a le bon rôle
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
      setCurrentUserId(session.user.id);
      console.log(
        "User authenticated:",
        session.user.id,
        "Role:",
        profile.role
      );
    } catch (error) {
      console.error("Error in checkAuth:", error);
      router.push("/login");
    } finally {
      setAuthChecking(false);
    }
  };

  // Charger les disputes après authentification
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      fetchDisputes();
    }
  }, [isAuthenticated, currentUserId]);

  useEffect(() => {
    filterDisputes();
  }, [disputes, searchTerm, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredDisputes]);

  const fetchDisputes = async () => {
    if (!currentUserId) {
      console.log("No current user ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Récupérer UNIQUEMENT les litiges créés par l'utilisateur connecté
      const { data: disputesData, error: disputesError } = await supabase
        .from("disputes")
        .select("*")
        .eq("created_by", currentUserId)
        .order("created_at", { ascending: false });

      if (disputesError) {
        console.error("Error fetching disputes:", disputesError);
        throw disputesError;
      }

      if (!disputesData || disputesData.length === 0) {
        console.log("No disputes found for current user");
        setDisputes([]);
        updateStats([]);
        setLoading(false);
        return;
      }

      console.log("Disputes fetched for user:", disputesData.length);

      // Récupérer les IDs des jobs uniques
      const jobIds = [
        ...new Set(disputesData.map((d) => d.job_id).filter((id) => id)),
      ];

      // Récupérer les IDs des utilisateurs uniques
      const userIds = [
        ...new Set(
          [
            ...disputesData.map((d) => d.against_user),
            ...disputesData
              .filter((d) => d.resolved_by)
              .map((d) => d.resolved_by),
          ].filter((id) => id)
        ),
      ];

      if (currentUserId && !userIds.includes(currentUserId)) {
        userIds.push(currentUserId);
      }

      // Fetch jobs
      let jobsMap = new Map();
      if (jobIds.length > 0) {
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .in("id", jobIds);

        if (!jobsError && jobsData) {
          jobsData.forEach((job) => {
            jobsMap.set(job.id, job);
          });
        }
      }

      // Fetch users/profiles
      let usersMap = new Map();
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, role")
          .in("id", userIds);

        if (!usersError && usersData) {
          usersData.forEach((user) => {
            usersMap.set(user.id, user);
          });
        }
      }

      // Combiner les données
      const disputesWithDetails = disputesData.map((dispute) => {
        let evidenceArray = dispute.evidence;
        if (typeof dispute.evidence === "string") {
          try {
            evidenceArray = JSON.parse(dispute.evidence);
          } catch (e) {
            evidenceArray = [];
          }
        }

        return {
          ...dispute,
          evidence: Array.isArray(evidenceArray) ? evidenceArray : [],
          job: jobsMap.get(dispute.job_id) || null,
          created_by_user: usersMap.get(dispute.created_by) || null,
          against_user_details: usersMap.get(dispute.against_user) || null,
          resolved_by_user: dispute.resolved_by
            ? usersMap.get(dispute.resolved_by)
            : null,
        };
      });

      setDisputes(disputesWithDetails);
      updateStats(disputesWithDetails);
    } catch (error) {
      console.error("Error in fetchDisputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (disputesData: DisputeWithDetails[]) => {
    setStats({
      total: disputesData.length,
      pending: disputesData.filter((d) => d.status === "pending").length,
      under_review: disputesData.filter((d) => d.status === "under_review")
        .length,
      resolved: disputesData.filter((d) => d.status === "resolved").length,
      dismissed: disputesData.filter((d) => d.status === "dismissed").length,
      payment: disputesData.filter((d) => d.type === "payment").length,
      quality: disputesData.filter((d) => d.type === "quality").length,
      timeline: disputesData.filter((d) => d.type === "timeline").length,
      communication: disputesData.filter((d) => d.type === "communication")
        .length,
      safety: disputesData.filter((d) => d.type === "safety").length,
      other: disputesData.filter((d) => d.type === "other").length,
    });
  };

  const filterDisputes = () => {
    let filtered = [...disputes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (dispute) =>
          dispute.description?.toLowerCase().includes(term) ||
          dispute.preferred_resolution?.toLowerCase().includes(term) ||
          dispute.job?.title?.toLowerCase().includes(term) ||
          dispute.job?.location?.toLowerCase().includes(term) ||
          dispute.created_by_user?.full_name?.toLowerCase().includes(term) ||
          dispute.against_user_details?.full_name?.toLowerCase().includes(term)
      );
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((dispute) => dispute.type === filters.type);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (dispute) => dispute.status === filters.status
      );
    }

    if (filters.dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(
            (dispute) => new Date(dispute.created_at) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(
            (dispute) => new Date(dispute.created_at) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(
            (dispute) => new Date(dispute.created_at) >= filterDate
          );
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(
            (dispute) => new Date(dispute.created_at) >= filterDate
          );
          break;
      }
    }

    setFilteredDisputes(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Under Review
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { icon: any; color: string; label: string }> =
      {
        payment: {
          icon: DollarSign,
          color: "bg-green-100 text-green-800",
          label: "Payment",
        },
        quality: {
          icon: Star,
          color: "bg-purple-100 text-purple-800",
          label: "Quality",
        },
        timeline: {
          icon: Calendar,
          color: "bg-orange-100 text-orange-800",
          label: "Timeline",
        },
        communication: {
          icon: MessageSquare,
          color: "bg-blue-100 text-blue-800",
          label: "Communication",
        },
        safety: {
          icon: Shield,
          color: "bg-red-100 text-red-800",
          label: "Safety",
        },
        other: {
          icon: AlertTriangle,
          color: "bg-gray-100 text-gray-800",
          label: "Other",
        },
      };

    const badge = badges[type] || badges.other;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalPages = Math.ceil(filteredDisputes.length / itemsPerPage);
  const paginatedDisputes = filteredDisputes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
    </div>
  );

  // Afficher un loader pendant la vérification de l'authentification
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Si non authentifié, ne pas afficher le contenu (la redirection est déjà en cours)
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Disputes</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and track disputes you have created
              </p>
            </div>
            <button
              onClick={fetchDisputes}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard
              title="My Disputes"
              value={stats.total}
              icon={AlertTriangle}
              color="bg-gray-100 text-gray-600"
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={Clock}
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard
              title="Under Review"
              value={stats.under_review}
              icon={AlertTriangle}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Resolved"
              value={stats.resolved}
              icon={CheckCircle}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title="Dismissed"
              value={stats.dismissed}
              icon={XCircle}
              color="bg-gray-100 text-gray-600"
            />
            <StatCard
              title="Payment Issues"
              value={stats.payment}
              icon={DollarSign}
              color="bg-green-100 text-green-600"
            />
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your disputes by description, job title, or user name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition ${
                    showFilters ||
                    Object.values(filters).some((v) => v !== "all")
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Dispute Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) =>
                        setFilters({ ...filters, type: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="all">All Types</option>
                      <option value="payment">Payment</option>
                      <option value="quality">Quality</option>
                      <option value="timeline">Timeline</option>
                      <option value="communication">Communication</option>
                      <option value="safety">Safety</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Date Range
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) =>
                        setFilters({ ...filters, dateRange: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Disputes Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Against
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedDisputes.map((dispute) => (
                    <tr
                      key={dispute.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3">
                        {getTypeBadge(dispute.type)}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {dispute.job?.title || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dispute.job?.location || "No location"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(dispute.job?.budget)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {dispute.against_user_details?.full_name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dispute.against_user_details?.role || "User"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className="text-sm text-gray-600 max-w-xs truncate"
                          title={dispute.description}
                        >
                          {dispute.description}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(dispute.status)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">
                          {formatDate(dispute.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setShowModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDisputes.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No disputes found
                </h3>
                <p className="text-sm text-gray-500">
                  You haven't created any disputes yet
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredDisputes.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredDisputes.length
                  )}{" "}
                  of {filteredDisputes.length} disputes
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
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
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      {showModal && selectedDispute && (
        <DisputeModal
          dispute={selectedDispute}
          onClose={() => {
            setShowModal(false);
            setSelectedDispute(null);
          }}
          onRefresh={fetchDisputes}
        />
      )}
    </div>
  );
}
