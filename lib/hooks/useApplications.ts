import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Application,
  ApplicationStats,
  FilterType,
  SortOption,
  ViewMode,
} from "@/types/application.types";
import { applicationsService } from "../applications.service";

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedApplications, setSelectedApplications] = useState<string[]>(
    []
  );
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(
    null
  );
  const router = useRouter();

  const fetchApplications = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      setError(null);

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;

        if (!user) {
          router.push("/login");
          return;
        }

        const data = await applicationsService.fetchApplications(user.id);
        setApplications(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to load applications. Please try again.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleWithdraw = useCallback(
    async (applicationId: string) => {
      if (!confirm("Are you sure you want to withdraw this application?"))
        return;

      try {
        await applicationsService.withdrawApplication(applicationId);
        showNotification("Application withdrawn successfully", "success");
        fetchApplications(true);
      } catch (error: any) {
        showNotification(error.message, "error");
      }
    },
    [fetchApplications]
  );

  const handleBulkWithdraw = useCallback(async () => {
    if (selectedApplications.length === 0) return;

    if (!confirm(`Withdraw ${selectedApplications.length} applications?`))
      return;

    try {
      await applicationsService.bulkWithdrawApplications(selectedApplications);
      showNotification(
        `${selectedApplications.length} applications withdrawn`,
        "success"
      );
      setSelectedApplications([]);
      setShowBulkActions(false);
      fetchApplications(true);
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  }, [selectedApplications, fetchApplications]);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    // Implémentez votre toast ici
    console.log(`${type}: ${message}`);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCustomerDetails = (customerId: string) => {
    setExpandedCustomerId((prev) => (prev === customerId ? null : customerId));
  };

  const clearFilters = useCallback(() => {
    setFilter("all");
    setSearchTerm("");
    setSortBy("newest");
  }, []);

  // Filtered and sorted applications
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
          app.customer?.company_name?.toLowerCase().includes(term) ||
          app.message?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "price_high":
          return (b.job.price || 0) - (a.job.price || 0);
        case "price_low":
          return (a.job.price || 0) - (b.job.price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [applications, filter, searchTerm, sortBy]);

  // Stats
  const stats = useMemo<ApplicationStats>(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
      successRate:
        applications.length > 0
          ? Math.round(
              (applications.filter((a) => a.status === "accepted").length /
                applications.length) *
                100
            )
          : 0,
    }),
    [applications]
  );

  return {
    // State
    applications,
    loading,
    filter,
    searchTerm,
    showFilters,
    isRefreshing,
    sortBy,
    viewMode,
    selectedApplications,
    showBulkActions,
    error,
    copiedId,
    expandedCustomerId,
    filteredApplications,
    stats,

    // Setters
    setFilter,
    setSearchTerm,
    setShowFilters,
    setSortBy,
    setViewMode,
    setSelectedApplications,
    setShowBulkActions,
    setExpandedCustomerId,

    // Actions
    fetchApplications,
    handleWithdraw,
    handleBulkWithdraw,
    copyToClipboard,
    toggleCustomerDetails,
    clearFilters,
  };
}
