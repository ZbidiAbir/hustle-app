import { Search, Filter, X } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
}

export function SearchBar({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
}: SearchBarProps) {
  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search jobs, companies, categories..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={onToggleFilters}
        className={`p-2 border rounded-lg transition ${
          showFilters || hasActiveFilters
            ? "bg-blue-50 border-blue-200 text-blue-600"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <Filter className="w-4 h-4" />
      </button>
    </div>
  );
}
