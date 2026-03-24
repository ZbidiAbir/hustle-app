import {
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Briefcase,
  Gavel,
} from "lucide-react";
import { useIconsAndBadges } from "../../../hooks/useIconsAndBadges";

export function WorkerActions({
  status,
  onAccept,
  onReject,
  processing,
  showRejectConfirm,
  setShowRejectConfirm,
  onContact,
  onViewJob,
  onDispute,
  isUpdatingDispute,
  existingDisputeStatus,
}: {
  status: string;
  onAccept: () => void;
  onReject: () => void;
  processing: boolean;
  showRejectConfirm: boolean;
  setShowRejectConfirm: (show: boolean) => void;
  onContact: () => void;
  onViewJob: () => void;
  onDispute: () => void;
  isUpdatingDispute: boolean;
  existingDisputeStatus: string | null;
}) {
  const { getDisputeStatusColor } = useIconsAndBadges();

  if (status === "pending") {
    return (
      <div className="space-y-3">
        <button
          onClick={onAccept}
          disabled={processing}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Accept Application
            </>
          )}
        </button>

        {!showRejectConfirm ? (
          <button
            onClick={() => setShowRejectConfirm(true)}
            disabled={processing}
            className="w-full py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition font-medium flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Reject Application
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-red-50 rounded-xl border-2 border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Are you sure you want to reject this application? This action
                cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectConfirm(false)}
                disabled={processing}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onReject}
                disabled={processing}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
              >
                {processing ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={onContact}
        className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        Contact Worker
      </button>
      <button
        onClick={onViewJob}
        className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
      >
        <Briefcase className="w-4 h-4" />
        View Job Details
      </button>
      <button
        onClick={onDispute}
        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition font-medium flex items-center justify-center gap-2 border border-red-200"
      >
        <Gavel className="w-4 h-4" />
        {isUpdatingDispute ? "Update Dispute" : "File a Dispute"}
        {existingDisputeStatus && (
          <span
            className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getDisputeStatusColor(
              existingDisputeStatus
            )}`}
          >
            {existingDisputeStatus}
          </span>
        )}
      </button>
    </div>
  );
}
