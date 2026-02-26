"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Calendar,
  Briefcase,
  MessageSquare,
  ChevronRight,
  Loader2,
  Filter,
  X,
  CheckCircle,
  Clock,
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  images: string[];
  created_at: string;
  customer_id: string;
  customer?: {
    full_name: string;
    email: string;
    rating?: number;
    jobs_posted?: number;
  };
  application_status?: "pending" | "accepted" | "rejected" | null;
  applied_at?: string;
};

export default function WorkerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price_high" | "price_low">(
    "newest"
  );
  const [showApplied, setShowApplied] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch all open jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      // Fetch customer profiles
      const customerIds = jobsData?.map((job) => job.customer_id) || [];
      const { data: customersData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", customerIds);

      const customersMap = new Map(customersData?.map((c) => [c.id, c]) || []);

      // If user is logged in, fetch their applications
      let applicationsMap = new Map();
      if (user) {
        const { data: applicationsData } = await supabase
          .from("applications")
          .select("job_id, status, created_at")
          .eq("worker_id", user.id);

        applicationsMap = new Map(
          applicationsData?.map((app) => [
            app.job_id,
            { status: app.status, applied_at: app.created_at },
          ]) || []
        );
      }

      // Combine jobs with customer info and application status
      const jobsWithDetails = (jobsData || []).map((job) => ({
        ...job,
        customer: customersMap.get(job.customer_id) || {
          full_name: "Client",
          email: "client@email.com",
        },
        application_status: applicationsMap.get(job.id)?.status || null,
        applied_at: applicationsMap.get(job.id)?.applied_at || null,
      }));

      setJobs(jobsWithDetails);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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
          job.description.toLowerCase().includes(term) ||
          job.location.toLowerCase().includes(term) ||
          job.customer?.full_name?.toLowerCase().includes(term)
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
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "price_low":
        filtered.sort((a, b) => a.price - b.price);
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

  const getAvatarColor = useCallback((id: string) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-red-500 to-red-600",
      "from-yellow-500 to-yellow-600",
      "from-pink-500 to-pink-600",
      "from-indigo-500 to-indigo-600",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  }, []);

  const getApplicationBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return (
          <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Applied
          </div>
        );
      case "accepted":
        return (
          <div className="absolute top-2 left-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Accepted
          </div>
        );
      case "rejected":
        return (
          <div className="absolute top-2 left-2 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
            Rejected
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Available Jobs
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {filteredJobs.length} job(s) found
              </p>
            </div>
            <button
              onClick={() => fetchJobs(true)}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              <Loader2
                className={`w-4 h-4 text-gray-600 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition ${
                showFilters ||
                selectedCategory !== "all" ||
                sortBy !== "newest" ||
                showApplied !== null
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
              {/* Applied Filter */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Application Status
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowApplied(null)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      showApplied === null
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowApplied(true)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      showApplied === true
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Applied
                  </button>
                  <button
                    onClick={() => setShowApplied(false)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      showApplied === false
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Not Applied
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat === "all" ? "All" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Sort by
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy("newest")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      sortBy === "newest"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => setSortBy("price_high")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      sortBy === "price_high"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Price: High
                  </button>
                  <button
                    onClick={() => setSortBy("price_low")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      sortBy === "price_low"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Price: Low
                  </button>
                </div>
              </div>

              {/* Clear filters */}
              {(selectedCategory !== "all" ||
                searchTerm ||
                sortBy !== "newest" ||
                showApplied !== null) && (
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchTerm("");
                    setSortBy("newest");
                    setShowApplied(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="px-4 py-4">
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all overflow-hidden group relative"
              >
                {/* Application Status Badge */}
                {job.application_status &&
                  getApplicationBadge(job.application_status)}

                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  {job.images && job.images.length > 0 ? (
                    <img
                      src={job.images[0]}
                      alt={job.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {/* Price badge */}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                    <span className="font-bold text-blue-600">
                      ${job.price}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Category and Date */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {job.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(job.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                    {job.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {job.description}
                  </p>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{job.location}</span>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {/* Customer Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-r ${getAvatarColor(
                          job.customer_id
                        )} flex items-center justify-center text-white text-xs font-medium shadow-sm`}
                      >
                        {job.customer?.full_name?.charAt(0).toUpperCase() ||
                          "C"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {job.customer?.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {job.customer?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleChatClick(job.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                    <Link
                      href={`/worker/dashboard/job/${job.id}`}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Applied date if applicable */}
                  {job.applied_at && (
                    <p className="text-xs text-gray-400 mt-2 text-right">
                      Applied {formatDate(job.applied_at)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">
              No jobs found
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || selectedCategory !== "all" || showApplied !== null
                ? "Try adjusting your filters"
                : "Check back later for new opportunities"}
            </p>
            {(searchTerm ||
              selectedCategory !== "all" ||
              sortBy !== "newest" ||
              showApplied !== null) && (
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchTerm("");
                  setSortBy("newest");
                  setShowApplied(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
