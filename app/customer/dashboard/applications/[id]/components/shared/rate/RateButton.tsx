"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { RateModal } from "./RateModal";

interface RateButtonProps {
  jobId: string;
  workerId: string;
  workerName: string;
  jobTitle: string;
  jobStatus: string;
  hasRated: boolean;
  onRatingSuccess?: () => void;
  className?: string;
}

export function RateButton({
  jobId,
  workerId,
  workerName,
  jobTitle,
  jobStatus,
  hasRated,
  onRatingSuccess,
  className = "",
}: RateButtonProps) {
  const [showModal, setShowModal] = useState(false);

  // Only show button if job is completed and not already rated
  if (jobStatus !== "completed" || hasRated) {
    if (hasRated) {
      return (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
          <p className="text-sm text-green-700 flex items-center justify-center gap-2">
            <Star className="w-4 h-4 fill-green-500 text-green-500" />
            Thank you for rating this worker!
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`w-full py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-medium hover:from-yellow-600 hover:to-orange-600 transition shadow-md flex items-center justify-center gap-2 ${className}`}
      >
        <Star className="w-4 h-4 fill-current" />
        Rate this Worker
      </button>

      <RateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        jobId={jobId}
        workerId={workerId}
        workerName={workerName}
        jobTitle={jobTitle}
        onSuccess={onRatingSuccess}
      />
    </>
  );
}
