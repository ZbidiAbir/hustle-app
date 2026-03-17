import { Application } from "@/types/application.types";
import { Trash2, Copy, X as XIcon } from "lucide-react";

interface BulkActionsModalProps {
  selectedCount: number;
  applications: Application[];
  onWithdraw: () => void;
  onCopyEmails: () => void;
  onClose: () => void;
}

export function BulkActionsModal({
  selectedCount,
  applications,
  onWithdraw,
  onCopyEmails,
  onClose,
}: BulkActionsModalProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex gap-2 z-50">
      <button
        onClick={onWithdraw}
        className="px-3 py-2 hover:bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-600"
      >
        <Trash2 className="w-4 h-4" />
        Withdraw ({selectedCount})
      </button>
      <button
        onClick={onCopyEmails}
        className="px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
      >
        <Copy className="w-4 h-4" />
        Copy emails
      </button>
      <button
        onClick={onClose}
        className="px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
      >
        <XIcon className="w-4 h-4" />
        Clear
      </button>
    </div>
  );
}
