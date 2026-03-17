import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  RefreshCw,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import {
  ApplicationStats,
  FilterType,
  SortOption,
  ViewMode,
} from "@/types/application.types";

interface ApplicationHeaderProps {
  stats: ApplicationStats;
  filter: FilterType;
  searchTerm: string;
  sortBy: SortOption;
  viewMode: ViewMode;
  selectedCount: number;
  showFilters: boolean;
  isRefreshing: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onFilterChange: (filter: FilterType) => void;
  onSearchChange: (term: string) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  onToggleBulkActions: () => void;
}

export function ApplicationHeader({
  stats,
  filter,
  searchTerm,
  sortBy,
  viewMode,
  selectedCount,
  showFilters,
  isRefreshing,
  onBack,
  onRefresh,
  onFilterChange,
  onSearchChange,
  onSortChange,
  onViewModeChange,
  onToggleFilters,
  onClearFilters,
  onToggleBulkActions,
}: ApplicationHeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition group lg:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-black bg-clip-text">
                My Applications
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Track and manage your job applications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 relative group"
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-600 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                Refresh
              </span>
            </button>

            <Link
              href="/worker/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl"
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Jobs</span>
              <span className="sm:hidden">Jobs</span>
            </Link>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by job title, category, location, or customer..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
          </div>

          <div className="flex gap-2">
            {/* View Toggle */}
            <div className="flex bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange("grid")}
                className={`p-2 rounded-md transition ${
                  viewMode === "grid"
                    ? "bg-purple-100 text-purple-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange("list")}
                className={`p-2 rounded-md transition ${
                  viewMode === "list"
                    ? "bg-purple-100 text-purple-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price_high">Highest price</option>
              <option value="price_low">Lowest price</option>
            </select>

            {/* Filter Button */}
            <button
              onClick={onToggleFilters}
              className={`px-3 py-2 border rounded-lg transition flex items-center gap-2 ${
                filter !== "all" || searchTerm
                  ? "bg-purple-50 border-purple-200 text-purple-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {filter !== "all" && (
                <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                  1
                </span>
              )}
            </button>

            {/* Bulk Actions */}
            {selectedCount > 0 && (
              <button
                onClick={onToggleBulkActions}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <span className="text-sm">Bulk Actions</span>
                <span className="px-1.5 py-0.5 bg-white text-purple-600 text-xs rounded-full">
                  {selectedCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Filter by status</h3>
              <button
                onClick={onClearFilters}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "accepted", "rejected"] as FilterType[]).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => onFilterChange(f)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
                      filter === f
                        ? f === "all"
                          ? "bg-purple-600 text-white"
                          : f === "pending"
                          ? "bg-yellow-600 text-white"
                          : f === "accepted"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {f === "all"
                      ? "All"
                      : f.charAt(0).toUpperCase() + f.slice(1)}
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded-full ${
                        filter === f
                          ? "bg-white bg-opacity-20"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {f === "all"
                        ? stats.total
                        : stats[f as keyof typeof stats]}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(searchTerm || filter !== "all") && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-500">Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                Search: "{searchTerm}"
                <button
                  onClick={() => onSearchChange("")}
                  className="ml-1 hover:text-gray-900"
                >
                  ×
                </button>
              </span>
            )}
            {filter !== "all" && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                Status: {filter}
                <button
                  onClick={() => onFilterChange("all")}
                  className="ml-1 hover:text-gray-900"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={onClearFilters}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
