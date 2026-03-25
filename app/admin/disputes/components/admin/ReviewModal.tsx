// components/admin/ReviewModal.tsx
"use client";

import { useCallback, useRef } from "react";
import { Scale, XCircle, History } from "lucide-react";
import { ReviewFormContent } from "./ReviewFormContent";

type Dispute = {
  id: string;
  job_id: string;
  created_by: string;
  against_user: string;
  type:
    | "payment"
    | "quality"
    | "timeline"
    | "communication"
    | "safety"
    | "other";
  description: string;
  preferred_resolution: string;
  evidence: string[];
  status:
    | "pending"
    | "under_review"
    | "review_approved"
    | "resolved"
    | "dismissed";
  resolved_by: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  status_history: any[];
  created_at: string;
  updated_at: string;
};

type DisputeWithDetails = Dispute & {
  job?: any;
  created_by_user?: any;
  against_user_details?: any;
  resolved_by_user?: any;
  reviewed_by_user?: any;
  approved_by_user?: any;
  related_disputes?: DisputeWithDetails[];
};

type ReviewFormData = {
  action: "start_review" | "approve_review" | "resolve" | "dismiss";
  notes: string;
  resolution?:
    | "resolve_in_favor_of_worker"
    | "resolve_in_favor_of_customer"
    | "partial_refund";
  refundAmount?: number;
  actionRequired?: string;
};

interface ReviewModalProps {
  selectedDispute: DisputeWithDetails | null;
  reviewForm: ReviewFormData;
  submitting: boolean;
  onFormChange: (data: Partial<ReviewFormData>) => void;
  onSubmit: () => void;
  onClose: () => void;
  onViewHistory: () => void;
}

export const ReviewModal = ({
  selectedDispute,
  reviewForm,
  submitting,
  onFormChange,
  onSubmit,
  onClose,
  onViewHistory,
}: ReviewModalProps) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isRestoringRef = useRef<boolean>(false);

  const handleScroll = useCallback(() => {
    if (modalContentRef.current && !isRestoringRef.current) {
      scrollPositionRef.current = modalContentRef.current.scrollTop;
    }
  }, []);

  if (!selectedDispute) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-4xl flex flex-col"
        style={{ height: "90vh", maxHeight: "90vh" }}
      >
        {/* Header fixe */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Scale className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Review Dispute
              </h2>
              <p className="text-sm text-gray-500">
                Job: {selectedDispute.job?.title || "Unknown"} • Status:{" "}
                {selectedDispute.status}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onViewHistory}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="View Status History"
            >
              <History className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div
          ref={modalContentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6"
        >
          <ReviewFormContent
            selectedDispute={selectedDispute}
            reviewForm={reviewForm}
            onFormChange={onFormChange}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitting={submitting}
            onViewHistory={onViewHistory}
          />
        </div>
      </div>
    </div>
  );
};
