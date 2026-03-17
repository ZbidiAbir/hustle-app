import Link from "next/link";
import { Briefcase } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <div className="w-20 h-20 bg-linear-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Briefcase className="w-10 h-10 text-purple-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No applications found
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {hasFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : "You haven't applied to any jobs yet. Start exploring opportunities!"}
      </p>

      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-purple-600 hover:text-purple-700 font-medium mb-6 block mx-auto"
        >
          Clear all filters
        </button>
      )}

      <Link
        href="/worker/jobs"
        className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
      >
        <Briefcase className="w-4 h-4" />
        Browse Available Jobs
      </Link>

      {/* Suggestions */}
      <div className="mt-8 pt-8 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Popular categories
        </h4>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            "Plumbing",
            "Electrical",
            "Carpentry",
            "Painting",
            "Cleaning",
            "Moving",
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                // This will be handled by the parent component
                // You might want to pass a prop for this
              }}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
