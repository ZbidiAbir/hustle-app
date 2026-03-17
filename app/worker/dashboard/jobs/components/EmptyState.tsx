import { Briefcase } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <Briefcase className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">
        No jobs found
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {hasFilters
          ? "Try adjusting your filters"
          : "Check back later for new opportunities"}
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
