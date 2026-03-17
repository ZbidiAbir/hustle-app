import { Job } from "@/types/job";
import { formatDate, getUrgencyIcon } from "@/utils/jobDetail.utils";
import { Briefcase, MapPin, Calendar } from "lucide-react";

interface JobDetailsProps {
  job: Job;
  displayPrice: { amount: number | string; label: string } | null;
}

export function JobDetails({ job, displayPrice }: JobDetailsProps) {
  return (
    <div className="p-6">
      {/* Title and Price */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
        {displayPrice && (
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">
              $
              {typeof displayPrice.amount === "number"
                ? displayPrice.amount
                : displayPrice.amount}
            </div>
            <div className="text-xs text-gray-500">{displayPrice.label}</div>
          </div>
        )}
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs">CATEGORY</span>
          </div>
          <p className="font-medium text-gray-900">{job.category}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">LOCATION</span>
          </div>
          <p className="font-medium text-gray-900">{job.location}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">POSTED</span>
          </div>
          <p className="font-medium text-gray-900">
            {formatDate(job.created_at)}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            {getUrgencyIcon(job.urgency)}
            <span className="text-xs">URGENCY</span>
          </div>
          <p className="font-medium text-gray-900 capitalize">
            {job.urgency || "Flexible"}
          </p>
        </div>
      </div>
    </div>
  );
}
