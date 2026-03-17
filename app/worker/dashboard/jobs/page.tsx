"use client";

import { useState } from "react";
import { Clock3, Loader2 } from "lucide-react";
import { JobCard } from "./components/JobCard";
import { SearchBar } from "./components/SearchBar";
import { JobFilters } from "./components/JobFilters";
import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { useJobs } from "@/lib/hooks/useJobs";

export default function WorkerJobsPage() {
  const {
    loading,
    isRefreshing,
    filteredJobs,
    categories,
    selectedCategory,
    searchTerm,
    sortBy,
    showApplied,
    setSelectedCategory,
    setSearchTerm,
    setSortBy,
    setShowApplied,
    fetchJobs,
    handleChatClick,
    clearFilters,
  } = useJobs();

  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    selectedCategory !== "all" ||
    searchTerm !== "" ||
    sortBy !== "newest" ||
    showApplied !== null;

  if (loading) {
    return <LoadingState />;
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
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Filters Panel */}
          {showFilters && (
            <JobFilters
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              showApplied={showApplied}
              onShowAppliedChange={setShowApplied}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          )}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="px-4 py-4">
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} onChatClick={handleChatClick} />
            ))}
          </div>
        ) : (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        )}
      </div>
    </div>
  );
}
