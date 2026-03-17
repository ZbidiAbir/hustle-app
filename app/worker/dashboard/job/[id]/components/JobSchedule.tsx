import { Job } from "@/types/job";
import { formatJobDate } from "@/utils/jobDetail.utils";
import { Calendar } from "lucide-react";

interface JobScheduleProps {
  job: Job;
}

export function JobSchedule({ job }: JobScheduleProps) {
  if (!job.date && !job.time_slot) return null;

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center gap-2">
      <Calendar className="w-5 h-5 text-blue-600" />
      <div>
        <p className="text-sm font-medium text-gray-900">
          Scheduled for: {job.date && formatJobDate(job.date)}
          {job.time_slot && ` at ${job.time_slot}`}
        </p>
      </div>
    </div>
  );
}
