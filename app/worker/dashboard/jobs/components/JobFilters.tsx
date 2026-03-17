import { X } from "lucide-react";

interface JobFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: "newest" | "price_high" | "price_low";
  onSortChange: (sort: "newest" | "price_high" | "price_low") => void;
  showApplied: boolean | null;
  onShowAppliedChange: (value: boolean | null) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function JobFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  showApplied,
  onShowAppliedChange,
  onClearFilters,
  hasActiveFilters,
}: JobFiltersProps) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {/* Applied Filter */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">
          Application Status
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onShowAppliedChange(null)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              showApplied === null
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onShowAppliedChange(true)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              showApplied === true
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Applied
          </button>
          <button
            onClick={() => onShowAppliedChange(false)}
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
        <p className="text-xs font-medium text-gray-500 mb-2">Categories</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
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
        <p className="text-xs font-medium text-gray-500 mb-2">Sort by</p>
        <div className="flex gap-2">
          <button
            onClick={() => onSortChange("newest")}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              sortBy === "newest"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => onSortChange("price_high")}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              sortBy === "price_high"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Price: High
          </button>
          <button
            onClick={() => onSortChange("price_low")}
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
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}
