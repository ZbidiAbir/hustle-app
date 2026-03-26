import { Job } from "@/types/chat";
import { getJobStatusColor, getJobStatusText } from "@/utils/chat.utils";
import { MapPin } from "lucide-react";

interface JobStatusBarProps {
  job: Job | null;
  hasApplied: boolean;
  onApply: () => void;
}

export function JobStatusBar({ job, hasApplied, onApply }: JobStatusBarProps) {
  if (!job) return null;

  return (
    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-xs">
      <div className="flex items-center gap-1 text-gray-500">
        <MapPin className="w-3.5 h-3.5" />
        <span>{job.location}</span>
      </div>
      <span
        className={`px-2 py-0.5 rounded-full font-medium ${getJobStatusColor(
          job.status
        )}`}
      >
        Job {getJobStatusText(job.status)}
      </span>
      {!hasApplied && job.status === "open" && (
        <button
          onClick={onApply}
          className="ml-auto px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition"
        >
          Apply Now
        </button>
      )}
    </div>
  );
}
