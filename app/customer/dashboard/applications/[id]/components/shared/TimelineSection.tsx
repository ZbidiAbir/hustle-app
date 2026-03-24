import { Clock } from "lucide-react";

export function TimelineSection({
  job,
  formatDate,
}: {
  job: { created_at: string; start_date?: string; end_date?: string };
  formatDate: (date: string) => string;
}) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Timeline
      </h4>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            Posted: {formatDate(job.created_at)}
          </span>
        </div>
        {job.start_date && (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Start: {formatDate(job.start_date)}
            </span>
          </div>
        )}
        {job.end_date && (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              End: {formatDate(job.end_date)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
