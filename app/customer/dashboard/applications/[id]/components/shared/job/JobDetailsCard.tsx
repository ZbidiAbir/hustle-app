import { Briefcase, Tag, DollarSign, MapPin, Calendar } from "lucide-react";
import { Job } from "../../../types";
import { useFormatters } from "../../../hooks/useFormatters";
import { useIconsAndBadges } from "../../../hooks/useIconsAndBadges";
import { InfoItem } from "../InfoItem";
import { TimelineSection } from "../TimelineSection";
import { RequirementsSection } from "../RequirementsSection";
import { ImagesSection } from "../ImagesSection";

export function JobDetailsCard({
  job,
  expanded = false,
}: {
  job: Job;
  expanded?: boolean;
}) {
  const { formatDate, formatCurrency } = useFormatters();
  const { getJobStatusColor } = useIconsAndBadges();

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Job Details
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getJobStatusColor(
              job.status
            )}`}
          >
            {job.status.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">{job.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <InfoItem icon={Tag} label="Category" value={job.category} />
          <InfoItem
            icon={DollarSign}
            label="Budget"
            value={formatCurrency(job.price)}
          />
          <InfoItem icon={MapPin} label="Location" value={job.location} />
          <InfoItem
            icon={Calendar}
            label="Posted on"
            value={formatDate(job.created_at)}
          />
        </div>

        {expanded && (
          <>
            <TimelineSection job={job} formatDate={formatDate} />
            <RequirementsSection requirements={job.requirements} />
          </>
        )}

        <ImagesSection images={job.images} expanded={expanded} />
      </div>
    </div>
  );
}
