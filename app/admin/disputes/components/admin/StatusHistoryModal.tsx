// components/admin/StatusHistoryModal.tsx
"use client";

import { History, XCircle, CheckCircle, Eye, Clock } from "lucide-react";

type DisputeWithDetails = {
  id: string;
  status_history: any[];
  [key: string]: any;
};

interface StatusHistoryModalProps {
  selectedDispute: DisputeWithDetails | null;
  onClose: () => void;
  formatDate: (dateString?: string) => string;
}

export const StatusHistoryModal = ({
  selectedDispute,
  onClose,
  formatDate,
}: StatusHistoryModalProps) => {
  if (!selectedDispute) return null;
  const history = selectedDispute.status_history || [];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Status History
              </h2>
              <p className="text-sm text-gray-500">
                Dispute ID: {selectedDispute.id.substring(0, 8)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No status changes recorded yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {history.map((entry: any, index: number) => (
                  <div key={index} className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      {entry.to_status === "resolved" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : entry.to_status === "under_review" ? (
                        <Eye className="w-4 h-4 text-blue-600" />
                      ) : (
                        <History className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {entry.from_status} → {entry.to_status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(entry.changed_at)}
                          </span>
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          {entry.notes}
                        </p>
                      )}
                      {entry.action && (
                        <p className="text-xs text-gray-400 mt-1">
                          Action: {entry.action}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
