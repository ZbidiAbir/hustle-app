import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ApplicationStatus, Job, SortBy } from "@/types/job";
import { jobsService } from "../jobs.service";

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [showApplied, setShowApplied] = useState<ApplicationStatus>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const fetchJobs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const jobsData = await jobsService.fetchJobs(user?.id);
      setJobs(jobsData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = jobs.map((j) => j.category);
    return ["all", ...new Set(cats)];
  }, [jobs]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((job) => job.category === selectedCategory);
    }

    // Filter by applied status
    if (showApplied !== null) {
      filtered = filtered.filter((job) =>
        showApplied ? job.application_status : !job.application_status
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.description?.toLowerCase().includes(term) ||
          job.location?.toLowerCase().includes(term) ||
          job.customer?.full_name?.toLowerCase().includes(term) ||
          job.customer?.company_name?.toLowerCase().includes(term) ||
          job.category?.toLowerCase().includes(term)
      );
    }

    // Sort jobs
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "price_high":
        filtered.sort((a, b) => {
          const priceA = a.fixed_rate || a.hourly_rate || a.price || 0;
          const priceB = b.fixed_rate || b.hourly_rate || b.price || 0;
          return priceB - priceA;
        });
        break;
      case "price_low":
        filtered.sort((a, b) => {
          const priceA = a.fixed_rate || a.hourly_rate || a.price || 0;
          const priceB = b.fixed_rate || b.hourly_rate || b.price || 0;
          return priceA - priceB;
        });
        break;
    }

    return filtered;
  }, [jobs, selectedCategory, searchTerm, sortBy, showApplied]);

  const handleChatClick = useCallback(
    (jobId: string) => {
      router.push(`/worker/dashboard/chat/${jobId}`);
    },
    [router]
  );

  const clearFilters = useCallback(() => {
    setSelectedCategory("all");
    setSearchTerm("");
    setSortBy("newest");
    setShowApplied(null);
  }, []);

  return {
    jobs,
    loading,
    isRefreshing,
    filteredJobs,
    categories,
    selectedCategory,
    searchTerm,
    sortBy,
    showApplied,
    filtersVisible: false,
    setSelectedCategory,
    setSearchTerm,
    setSortBy,
    setShowApplied,
    fetchJobs,
    handleChatClick,
    clearFilters,
  };
}
