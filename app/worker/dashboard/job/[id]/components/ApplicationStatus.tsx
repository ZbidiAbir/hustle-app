import { Application } from "@/types/jobDetail";
import { getStatusBadge } from "@/utils/jobDetail.utils";
import { Clock } from "lucide-react";

interface ApplicationStatusProps {
  application: Application;
}

export function ApplicationStatus({ application }: ApplicationStatusProps) {
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Application Status
      </p>
      {getStatusBadge(application.status)}

      {/* Display application message if exists */}
      {application.message && (
        <div className="mt-3 p-3 bg-white rounded-lg border-l-2 border-purple-500">
          <p className="text-sm text-gray-600 italic">
            "{application.message}"
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">
        Applied on {new Date(application.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
