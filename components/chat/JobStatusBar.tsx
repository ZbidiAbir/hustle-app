"use client";
import { chatService } from "@/lib/chat.service";
import { getCurrentUser } from "@/lib/common/currentUser";
import { Job, User } from "@/modules/chat/types/chat.types";
import { getJobStatusColor, getJobStatusText } from "@/utils/chat.utils";
import { MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface JobStatusBarProps {
  job: Job | null;
  currentUser?: User | null;
}

export function JobStatusBar({ job, currentUser }: JobStatusBarProps) {
  const [application, setApplication] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplication() {
      try {
        if (job && currentUser) {
          const application = await chatService.getApplication(
            job.id,
            currentUser.id,
          );
          setApplication(application);
        }
      } catch (error) {
        console.log("Error fetching application:", error);
      }
    }

    fetchApplication();
  }, [job, currentUser]);

  const applyForJob = useCallback(async () => {
    if (!currentUser || !job) return;

    try {
      const data = await chatService.applyForJob(job.id, currentUser.id);
      setApplication(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [currentUser, job]);
  if (!job) return null;

  return (
    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-xs">
      <div className="flex items-center gap-1 text-gray-500">
        <MapPin className="w-3.5 h-3.5" />
        <span>{job.location}</span>
      </div>
      <span
        className={`px-2 py-0.5 rounded-full font-medium ${getJobStatusColor(
          job.status,
        )}`}
      >
        Job {getJobStatusText(job.status)}
      </span>
      {!application && job.status === "open" && (
        <button
          onClick={applyForJob}
          className="ml-auto px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition"
        >
          Apply Now
        </button>
      )}
    </div>
  );
}
