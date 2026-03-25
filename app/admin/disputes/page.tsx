// app/admin/disputes/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
  Scale,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Users,
  History,
  Star,
  Shield,
} from "lucide-react";
import { StatCard } from "./components/admin/StatCard";
import { ReviewModal } from "./components/admin/ReviewModal";
import { StatusHistoryModal } from "./components/admin/StatusHistoryModal";

type Dispute = {
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
  status:
    | "pending"
    | "under_review"
    | "review_approved"
    | "resolved"
    | "dismissed";
  resolved_by: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  status_history: any[];
  created_at: string;
  updated_at: string;
};

type DisputeWithDetails = Dispute & {
  job?: any;
  created_by_user?: any;
  against_user_details?: any;
  resolved_by_user?: any;
  reviewed_by_user?: any;
  approved_by_user?: any;
  related_disputes?: DisputeWithDetails[];
};

type ReviewFormData = {
  action: "start_review" | "approve_review" | "resolve" | "dismiss";
  notes: string;
  resolution?:
    | "resolve_in_favor_of_worker"
    | "resolve_in_favor_of_customer"
    | "partial_refund";
  refundAmount?: number;
  actionRequired?: string;
};

export default function AdminDisputesManagementPage() {
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<
    DisputeWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] =
    useState<DisputeWithDetails | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    dateRange: "all",
    role: "all",
    hasMultiple: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    under_review: 0,
    review_approved: 0,
    resolved: 0,
    dismissed: 0,
    payment: 0,
    quality: 0,
    timeline: 0,
    communication: 0,
    safety: 0,
    other: 0,
    jobsWithMultipleDisputes: 0,
  });
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    action: "start_review",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  useEffect(() => {
    filterDisputes();
  }, [disputes, searchTerm, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredDisputes]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const { data: disputesData, error: disputesError } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });

      if (disputesError) throw disputesError;

      if (!disputesData || disputesData.length === 0) {
        setDisputes([]);
        updateStats([]);
        setLoading(false);
        return;
      }

      const jobIds = [
        ...new Set(disputesData.map((d) => d.job_id).filter((id) => id)),
      ];
      const userIds = [
        ...new Set(
          [
            ...disputesData.map((d) => d.created_by),
            ...disputesData.map((d) => d.against_user),
            ...disputesData
              .filter((d) => d.resolved_by)
              .map((d) => d.resolved_by),
            ...disputesData
              .filter((d) => d.reviewed_by)
              .map((d) => d.reviewed_by),
            ...disputesData
              .filter((d) => d.approved_by)
              .map((d) => d.approved_by),
          ].filter((id) => id)
        ),
      ];

      let jobsMap = new Map();
      if (jobIds.length > 0) {
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .in("id", jobIds);
        if (!jobsError && jobsData) {
          jobsData.forEach((job) => jobsMap.set(job.id, job));
        }
      }

      let usersMap = new Map();
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, avatar_url, role, phone, account_type, company_name, business_verified"
          )
          .in("id", userIds);
        if (!usersError && usersData) {
          usersData.forEach((user) => usersMap.set(user.id, user));
        }
      }

      const disputesByJob = new Map<string, DisputeWithDetails[]>();

      const disputesWithDetails = disputesData.map((dispute) => {
        let evidenceArray = dispute.evidence;
        if (typeof dispute.evidence === "string") {
          try {
            evidenceArray = JSON.parse(dispute.evidence);
          } catch (e) {
            evidenceArray = [];
          }
        }

        let statusHistory = dispute.status_history;
        if (typeof dispute.status_history === "string") {
          try {
            statusHistory = JSON.parse(dispute.status_history);
          } catch (e) {
            statusHistory = [];
          }
        }

        return {
          ...dispute,
          evidence: Array.isArray(evidenceArray) ? evidenceArray : [],
          status_history: Array.isArray(statusHistory) ? statusHistory : [],
          job: jobsMap.get(dispute.job_id) || null,
          created_by_user: usersMap.get(dispute.created_by) || null,
          against_user_details: usersMap.get(dispute.against_user) || null,
          resolved_by_user: dispute.resolved_by
            ? usersMap.get(dispute.resolved_by)
            : null,
          reviewed_by_user: dispute.reviewed_by
            ? usersMap.get(dispute.reviewed_by)
            : null,
          approved_by_user: dispute.approved_by
            ? usersMap.get(dispute.approved_by)
            : null,
        };
      });

      disputesWithDetails.forEach((dispute) => {
        if (!disputesByJob.has(dispute.job_id)) {
          disputesByJob.set(dispute.job_id, []);
        }
        disputesByJob.get(dispute.job_id)!.push(dispute);
      });

      const disputesWithRelated = disputesWithDetails.map((dispute) => ({
        ...dispute,
        related_disputes:
          disputesByJob
            .get(dispute.job_id)
            ?.filter((d) => d.id !== dispute.id) || [],
      }));

      setDisputes(disputesWithRelated);
      updateStats(disputesWithRelated);

      const multipleDisputesJobs = Array.from(disputesByJob.values()).filter(
        (disputes) => disputes.length > 1
      ).length;
      setStats((prev) => ({
        ...prev,
        jobsWithMultipleDisputes: multipleDisputesJobs,
      }));
    } catch (error) {
      console.error("Error fetching disputes:", error);
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
      review_approved: disputesData.filter(
        (d) => d.status === "review_approved"
      ).length,
      resolved: disputesData.filter((d) => d.status === "resolved").length,
      dismissed: disputesData.filter((d) => d.status === "dismissed").length,
      payment: disputesData.filter((d) => d.type === "payment").length,
      quality: disputesData.filter((d) => d.type === "quality").length,
      timeline: disputesData.filter((d) => d.type === "timeline").length,
      communication: disputesData.filter((d) => d.type === "communication")
        .length,
      safety: disputesData.filter((d) => d.type === "safety").length,
      other: disputesData.filter((d) => d.type === "other").length,
      jobsWithMultipleDisputes: stats.jobsWithMultipleDisputes,
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

    if (filters.role !== "all") {
      filtered = filtered.filter((dispute) =>
        filters.role === "worker"
          ? dispute.created_by_user?.role === "worker"
          : dispute.created_by_user?.role === "customer"
      );
    }

    if (filters.hasMultiple === "yes") {
      filtered = filtered.filter(
        (dispute) => (dispute.related_disputes?.length || 0) > 0
      );
    } else if (filters.hasMultiple === "no") {
      filtered = filtered.filter(
        (dispute) => (dispute.related_disputes?.length || 0) === 0
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

  const addStatusHistoryEntry = async (
    disputeId: string,
    newStatus: string,
    notes: string
  ) => {
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) return;

    const { data: userData } = await supabase.auth.getUser();
    const historyEntry = {
      from_status: dispute.status,
      to_status: newStatus,
      changed_by: userData.user?.id,
      changed_at: new Date().toISOString(),
      notes: notes,
      action: reviewForm.action,
    };

    const updatedHistory = [...(dispute.status_history || []), historyEntry];
    return updatedHistory;
  };

  const handleReviewAction = async () => {
    if (!selectedDispute) return;
    if (!reviewForm.notes.trim()) {
      alert("Please provide notes for this action");
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const now = new Date().toISOString();

      let updateData: any = {
        updated_at: now,
        resolution_notes: reviewForm.notes,
      };
      let newStatus = selectedDispute.status;

      switch (reviewForm.action) {
        case "start_review":
          newStatus = "under_review";
          updateData.reviewed_by = userId;
          updateData.reviewed_at = now;
          break;
        case "approve_review":
          newStatus = "review_approved";
          updateData.approved_by = userId;
          updateData.approved_at = now;
          break;
        case "resolve":
          newStatus = "resolved";
          updateData.resolved_by = userId;
          updateData.resolved_at = now;
          if (reviewForm.resolution) {
            updateData.resolution_notes = `${reviewForm.resolution}: ${
              reviewForm.notes
            }${
              reviewForm.refundAmount
                ? `\nRefund amount: $${reviewForm.refundAmount}`
                : ""
            }${
              reviewForm.actionRequired
                ? `\nAction required: ${reviewForm.actionRequired}`
                : ""
            }`;
          }
          break;
        case "dismiss":
          newStatus = "dismissed";
          updateData.resolved_by = userId;
          updateData.resolved_at = now;
          break;
      }

      const updatedHistory = await addStatusHistoryEntry(
        selectedDispute.id,
        newStatus,
        reviewForm.notes
      );
      if (updatedHistory) updateData.status_history = updatedHistory;
      updateData.status = newStatus;

      const { error } = await supabase
        .from("disputes")
        .update(updateData)
        .eq("id", selectedDispute.id);
      if (error) throw error;

      alert("✅ Action completed successfully!");
      fetchDisputes();
      setShowReviewModal(false);
      setSelectedDispute(null);
      setReviewForm({ action: "start_review", notes: "" });
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <Eye className="w-3 h-3" /> Under Review
          </span>
        );
      case "review_approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" /> Review Approved
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" /> Resolved
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" /> Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<
      string,
      { icon: any; color: string; label: string; bg: string }
    > = {
      payment: {
        icon: DollarSign,
        color: "text-green-700",
        bg: "bg-green-50",
        label: "Payment",
      },
      quality: {
        icon: Star,
        color: "text-purple-700",
        bg: "bg-purple-50",
        label: "Quality",
      },
      timeline: {
        icon: Calendar,
        color: "text-orange-700",
        bg: "bg-orange-50",
        label: "Timeline",
      },
      communication: {
        icon: MessageSquare,
        color: "text-blue-700",
        bg: "bg-blue-50",
        label: "Communication",
      },
      safety: {
        icon: Shield,
        color: "text-red-700",
        bg: "bg-red-50",
        label: "Safety",
      },
      other: {
        icon: AlertTriangle,
        color: "text-gray-700",
        bg: "bg-gray-50",
        label: "Other",
      },
    };

    const badge = badges[type] || badges.other;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}
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

  const handleFormChange = (data: Partial<ReviewFormData>) => {
    setReviewForm((prev) => ({ ...prev, ...data }));
  };

  const totalPages = Math.ceil(filteredDisputes.length / itemsPerPage);
  const paginatedDisputes = filteredDisputes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Scale className="w-6 h-6 text-blue-600" />
                Dispute Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Review and resolve customer and worker disputes
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

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <StatCard
              title="Total Disputes"
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
              icon={Eye}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Review Approved"
              value={stats.review_approved}
              icon={CheckCircle}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title="Resolved"
              value={stats.resolved}
              icon={CheckCircle}
              color="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              title="Dismissed"
              value={stats.dismissed}
              icon={XCircle}
              color="bg-gray-100 text-gray-600"
            />
            <StatCard
              title="Multiple Disputes"
              value={stats.jobsWithMultipleDisputes}
              icon={Users}
              color="bg-orange-100 text-orange-600"
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
                  placeholder="Search by description, job title, or user name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition ${
                  showFilters || Object.values(filters).some((v) => v !== "all")
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Dispute Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) =>
                        setFilters({ ...filters, type: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
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
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="review_approved">Review Approved</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Filed By
                    </label>
                    <select
                      value={filters.role}
                      onChange={(e) =>
                        setFilters({ ...filters, role: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    >
                      <option value="all">All</option>
                      <option value="worker">Worker</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Multiple Disputes
                    </label>
                    <select
                      value={filters.hasMultiple}
                      onChange={(e) =>
                        setFilters({ ...filters, hasMultiple: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    >
                      <option value="all">All</option>
                      <option value="yes">Has Multiple Disputes</option>
                      <option value="no">Single Dispute Only</option>
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
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
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
                      Disputants
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
                  {paginatedDisputes.map((dispute) => {
                    const hasMultiple =
                      (dispute.related_disputes?.length || 0) > 0;
                    return (
                      <tr
                        key={dispute.id}
                        className={`hover:bg-gray-50 transition ${
                          hasMultiple ? "bg-orange-50/30" : ""
                        }`}
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
                            {hasMultiple && (
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                <Users className="w-2.5 h-2.5" />
                                {dispute.related_disputes?.length} other
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <span className="font-medium">From:</span>
                              <span className="text-blue-600">
                                {dispute.created_by_user?.full_name || "N/A"}
                              </span>
                              <span className="text-gray-400 text-xs">
                                ({dispute.created_by_user?.role})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="font-medium">Against:</span>
                              <span className="text-red-600">
                                {dispute.against_user_details?.full_name ||
                                  "N/A"}
                              </span>
                              <span className="text-gray-400 text-xs">
                                ({dispute.against_user_details?.role})
                              </span>
                            </div>
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
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setShowReviewModal(true);
                              }}
                              className="p-1.5 hover:bg-blue-100 rounded-lg transition"
                              title="Review Dispute"
                            >
                              <Scale className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setShowStatusHistoryModal(true);
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                              title="View Status History"
                            >
                              <History className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredDisputes.length === 0 && (
              <div className="text-center py-12">
                <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No disputes found
                </h3>
                <p className="text-sm text-gray-500">
                  No disputes match your search criteria
                </p>
              </div>
            )}

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

      {/* Modals */}
      {showReviewModal && (
        <ReviewModal
          selectedDispute={selectedDispute}
          reviewForm={reviewForm}
          submitting={submitting}
          onFormChange={handleFormChange}
          onSubmit={handleReviewAction}
          onClose={() => setShowReviewModal(false)}
          onViewHistory={() => setShowStatusHistoryModal(true)}
        />
      )}

      {showStatusHistoryModal && (
        <StatusHistoryModal
          selectedDispute={selectedDispute}
          onClose={() => setShowStatusHistoryModal(false)}
          formatDate={formatDate}
        />
      )}

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
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
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
