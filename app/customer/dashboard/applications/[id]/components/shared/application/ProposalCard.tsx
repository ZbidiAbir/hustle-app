import { FileText, Clock } from "lucide-react";
import { Application } from "../../../types";
import { useFormatters } from "../../../hooks/useFormatters";
import { QuickStats } from "../QuickStats";

export function ProposalCard({ application }: { application: Application }) {
  const { formatRelativeTime, formatDate, formatCurrency } = useFormatters();

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Worker's Proposal
          </h2>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatRelativeTime(application.created_at)}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="prose max-w-none">
          <p className="text-gray-700 text-lg leading-relaxed">
            {application.message || (
              <span className="text-gray-400 italic">
                No message provided with this application.
              </span>
            )}
          </p>
        </div>

        <QuickStats
          timeline={
            application.job?.created_at
              ? formatDate(application.job.created_at)
              : "Flexible"
          }
          budget={application.job?.price || 0}
          location={application.job?.location || "Location not specified"}
          rateType={application.worker?.rate_type || undefined}
        />
      </div>
    </div>
  );
}
