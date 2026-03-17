"use client";

import { useRouter } from "next/navigation";
import { ApplicationHeader } from "./components/ApplicationHeader";
import { ApplicationCard } from "./components/ApplicationCard";
import { ApplicationListItem } from "./components/ApplicationListItem";
import { BulkActionsModal } from "./components/BulkActionsModal";
import { ErrorState } from "./components/ErrorState";
import { EmptyState } from "./components/EmptyState";
import { useApplications } from "@/lib/hooks/useApplications";
import { LoadingState } from "./LoadingState";
import { formatRelativeTime } from "@/utils/application.utils";

export default function WorkerApplicationsPage() {
  const router = useRouter();

  const {
    // State
    loading,
    error,
    filteredApplications,
    stats,
    filter,
    searchTerm,
    showFilters,
    isRefreshing,
    sortBy,
    viewMode,
    selectedApplications,
    showBulkActions,
    copiedId,
    expandedCustomerId,

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
  } = useApplications();

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => fetchApplications()} />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <ApplicationHeader
        stats={stats}
        filter={filter}
        searchTerm={searchTerm}
        sortBy={sortBy}
        viewMode={viewMode}
        selectedCount={selectedApplications.length}
        showFilters={showFilters}
        isRefreshing={isRefreshing}
        onBack={() => router.back()}
        onRefresh={() => fetchApplications(true)}
        onFilterChange={setFilter}
        onSearchChange={setSearchTerm}
        onSortChange={setSortBy}
        onViewModeChange={setViewMode}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={clearFilters}
        onToggleBulkActions={() => setShowBulkActions(!showBulkActions)}
      />

      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-900">
              {filteredApplications.length}
            </span>{" "}
            of <span className="font-medium text-gray-900">{stats.total}</span>{" "}
            applications
          </p>
          <p className="text-xs text-gray-400">
            Last updated {formatRelativeTime(new Date().toISOString())}
          </p>
        </div>

        {/* Applications Grid/List */}
        {filteredApplications.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  isSelected={selectedApplications.includes(app.id)}
                  isCopied={copiedId === app.id}
                  isExpanded={expandedCustomerId === app.customer?.id}
                  onSelect={() => {
                    if (selectedApplications.includes(app.id)) {
                      setSelectedApplications(
                        selectedApplications.filter((id) => id !== app.id)
                      );
                    } else {
                      setSelectedApplications([
                        ...selectedApplications,
                        app.id,
                      ]);
                    }
                  }}
                  onWithdraw={() => handleWithdraw(app.id)}
                  onCopyEmail={() =>
                    copyToClipboard(
                      app.customer?.company_email || app.customer?.email || "",
                      app.id
                    )
                  }
                  onToggleExpand={() =>
                    toggleCustomerDetails(app.customer?.id || "")
                  }
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <ApplicationListItem key={app.id} app={app} />
              ))}
            </div>
          )
        ) : (
          <EmptyState
            hasFilters={searchTerm !== "" || filter !== "all"}
            onClearFilters={clearFilters}
          />
        )}
      </main>

      {/* Bulk Actions Modal */}
      {showBulkActions && selectedApplications.length > 0 && (
        <BulkActionsModal
          selectedCount={selectedApplications.length}
          applications={filteredApplications.filter((app) =>
            selectedApplications.includes(app.id)
          )}
          onWithdraw={handleBulkWithdraw}
          onCopyEmails={() => {
            const emails = filteredApplications
              .filter((app) => selectedApplications.includes(app.id))
              .map((app) => app.customer?.company_email || app.customer?.email)
              .filter(Boolean)
              .join(", ");
            copyToClipboard(emails, "bulk");
          }}
          onClose={() => {
            setSelectedApplications([]);
            setShowBulkActions(false);
          }}
        />
      )}
    </div>
  );
}
