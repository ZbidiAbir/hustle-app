// components/admin/ReviewFormContent.tsx
"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ThumbsUp,
  DollarSign,
  Loader2,
  Image as ImageIcon,
  FileText,
  Download,
  ZoomIn,
  X,
  File,
  ExternalLink,
  Shield,
} from "lucide-react";

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

interface ReviewFormContentProps {
  selectedDispute: DisputeWithDetails;
  reviewForm: ReviewFormData;
  onFormChange: (data: Partial<ReviewFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  onViewHistory: () => void;
}

export const ReviewFormContent = ({
  selectedDispute,
  reviewForm,
  onFormChange,
  onSubmit,
  onCancel,
  submitting,
  onViewHistory,
}: ReviewFormContentProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );

  const isMultipleDisputes =
    (selectedDispute.related_disputes?.length || 0) > 0;
  const otherDisputes = selectedDispute.related_disputes || [];

  const getAvailableActions = () => {
    switch (selectedDispute.status) {
      case "pending":
        return [
          {
            value: "start_review",
            label: "Start Review",
            icon: Eye,
            color: "blue",
            description: "Begin reviewing this dispute",
          },
        ];
      case "under_review":
        return [
          {
            value: "approve_review",
            label: "Approve Review",
            icon: CheckCircle,
            color: "green",
            description: "Approve the review and move to final decision",
          },
          {
            value: "dismiss",
            label: "Dismiss",
            icon: XCircle,
            color: "red",
            description: "Dismiss the dispute without resolution",
          },
        ];
      case "review_approved":
        return [
          {
            value: "resolve",
            label: "Resolve Dispute",
            icon: CheckCircle,
            color: "emerald",
            description: "Make final resolution decision",
          },
          {
            value: "dismiss",
            label: "Dismiss",
            icon: XCircle,
            color: "red",
            description: "Dismiss the dispute without resolution",
          },
        ];
      default:
        return [];
    }
  };

  const availableActions = getAvailableActions();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <Eye className="w-3 h-3" />
            Under Review
          </span>
        );
      case "review_approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Review Approved
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const getFileType = (url: string) => {
    if (url.includes("sdimage") || url.includes("secure-download")) {
      return "secure_image";
    }

    const extension = url.split(".").pop()?.toLowerCase();
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(
        extension || ""
      )
    ) {
      return "image";
    }
    if (extension === "pdf") return "pdf";
    if (["doc", "docx"].includes(extension || "")) return "word";
    if (["txt", "text", "md"].includes(extension || "")) return "text";
    if (url.includes("storage.googleapis.com") || url.includes("supabase.co")) {
      if (url.match(/\.(jpg|jpeg|png|gif|webp)/i)) return "image";
    }
    return "other";
  };

  const getFileIcon = (url: string) => {
    const type = getFileType(url);
    switch (type) {
      case "image":
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case "secure_image":
        return <Shield className="w-5 h-5 text-green-500" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "word":
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFileName = (url: string) => {
    try {
      if (url.includes("sdimage") || url.includes("secure-download")) {
        const urlObj = new URL(url);
        const filename =
          urlObj.searchParams.get("filename") ||
          urlObj.searchParams.get("name");
        if (filename) return filename;
      }
      const segments = url.split("/");
      const lastSegment = segments[segments.length - 1];
      return lastSegment.split("?")[0] || "file";
    } catch {
      return "file";
    }
  };

  const handleImageError = (url: string) => {
    setImageLoadErrors((prev) => new Set(prev).add(url));
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  const isImage = (url: string) => {
    const type = getFileType(url);
    return type === "image" || type === "secure_image";
  };

  const EvidenceSection = () => {
    const evidence = selectedDispute.evidence || [];

    if (evidence.length === 0) {
      return (
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No evidence provided</p>
        </div>
      );
    }

    const images = evidence.filter((url) => isImage(url));
    const documents = evidence.filter((url) => !isImage(url));

    const displayImages = expandedEvidence ? images : images.slice(0, 4);

    return (
      <div className="space-y-4">
        {/* Images Gallery */}
        {images.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">
                Images ({images.length})
              </p>
              {images.length > 4 && (
                <button
                  onClick={() => setExpandedEvidence(!expandedEvidence)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {expandedEvidence ? (
                    <>Show less</>
                  ) : (
                    <>Show all ({images.length})</>
                  )}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {displayImages.map((url, index) => {
                const isSecureImage =
                  url.includes("sdimage") || url.includes("secure-download");
                const hasError = imageLoadErrors.has(url);

                return (
                  <div
                    key={index}
                    className="relative group cursor-pointer"
                    onClick={() => !hasError && handleImageClick(url)}
                  >
                    {hasError ? (
                      <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500 text-center px-2">
                          Unable to load image
                        </p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 mt-1 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View directly
                        </a>
                      </div>
                    ) : (
                      <>
                        <img
                          src={url}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:border-blue-500 transition"
                          onError={() => handleImageError(url)}
                        />
                        {isSecureImage && (
                          <div className="absolute top-2 right-2 bg-green-500/80 text-white rounded-full p-1">
                            <Shield className="w-3 h-3" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg transition flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documents List */}
        {documents.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Documents ({documents.length})
            </p>
            <div className="space-y-2">
              {documents.map((url, index) => {
                const fileName = getFileName(url);
                const fileType = getFileType(url);
                const isSecure = fileType === "secure_image";

                return (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(url)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {fileName}
                          </p>
                          {isSecure && (
                            <Shield className="w-3 h-3 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 capitalize">
                          {fileType === "secure_image"
                            ? "Secure Image"
                            : fileType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Multiple Disputes Alert */}
      {isMultipleDisputes && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Multiple Disputes Detected
              </p>
              <p className="text-sm text-orange-700 mt-1">
                This job has {otherDisputes.length} other dispute(s). You can
                handle them together or separately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Status Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Current Status</p>
            {getStatusBadge(selectedDispute.status)}
          </div>
          {selectedDispute.reviewed_at && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Reviewed by</p>
              <p className="text-sm font-medium text-gray-900">
                {selectedDispute.reviewed_by_user?.full_name || "Admin"}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(selectedDispute.reviewed_at)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Created By</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {selectedDispute.created_by_user?.full_name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {selectedDispute.created_by_user?.full_name}
              </p>
              <p className="text-xs text-gray-500">
                {selectedDispute.created_by_user?.role}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Against</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-medium">
              {selectedDispute.against_user_details?.full_name?.charAt(0) ||
                "?"}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {selectedDispute.against_user_details?.full_name}
              </p>
              <p className="text-xs text-gray-500">
                {selectedDispute.against_user_details?.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-gray-700 whitespace-pre-wrap">
            {selectedDispute.description}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Preferred Resolution
        </p>
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-gray-700 whitespace-pre-wrap">
            {selectedDispute.preferred_resolution}
          </p>
        </div>
      </div>

      {/* Evidence Section */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Evidence
        </p>
        <EvidenceSection />
      </div>

      {/* Action Form */}
      {availableActions.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-medium text-gray-900 mb-4">Take Action</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Action
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableActions.map((action) => {
                  const Icon = action.icon;
                  const isSelected = reviewForm.action === action.value;
                  return (
                    <button
                      key={action.value}
                      onClick={() =>
                        onFormChange({ action: action.value as any })
                      }
                      type="button"
                      className={`p-3 rounded-xl border-2 transition flex items-center gap-2 ${
                        isSelected
                          ? `border-${action.color}-500 bg-${action.color}-50`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className={`w-4 h-4 text-${action.color}-600`} />
                      <div className="text-left">
                        <span className="text-sm font-medium">
                          {action.label}
                        </span>
                        <p className="text-xs text-gray-500">
                          {action.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {reviewForm.action === "resolve" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        onFormChange({
                          resolution: "resolve_in_favor_of_worker",
                        })
                      }
                      type="button"
                      className={`p-2 rounded-lg border text-sm ${
                        reviewForm.resolution === "resolve_in_favor_of_worker"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4 inline mr-1" />
                      Favor Worker
                    </button>
                    <button
                      onClick={() =>
                        onFormChange({
                          resolution: "resolve_in_favor_of_customer",
                        })
                      }
                      type="button"
                      className={`p-2 rounded-lg border text-sm ${
                        reviewForm.resolution === "resolve_in_favor_of_customer"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4 inline mr-1" />
                      Favor Customer
                    </button>
                    <button
                      onClick={() =>
                        onFormChange({ resolution: "partial_refund" })
                      }
                      type="button"
                      className={`p-2 rounded-lg border text-sm ${
                        reviewForm.resolution === "partial_refund"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-gray-200"
                      }`}
                    >
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Partial Refund
                    </button>
                  </div>
                </div>

                {reviewForm.resolution === "partial_refund" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Amount
                    </label>
                    <input
                      type="number"
                      value={reviewForm.refundAmount || ""}
                      onChange={(e) =>
                        onFormChange({
                          refundAmount: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                      placeholder="Enter amount"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Required (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewForm.actionRequired || ""}
                    onChange={(e) =>
                      onFormChange({ actionRequired: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    placeholder="e.g., Customer must provide proof of completion"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes *
              </label>
              <textarea
                value={reviewForm.notes}
                onChange={(e) => onFormChange({ notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Provide detailed notes about this action..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Resolution Info if already resolved */}
      {selectedDispute.status === "resolved" &&
        selectedDispute.resolution_notes && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Resolution Information
            </h3>
            <p className="text-sm text-green-700 whitespace-pre-wrap">
              {selectedDispute.resolution_notes}
            </p>
            {selectedDispute.resolved_by_user && (
              <p className="text-xs text-green-600 mt-2">
                Resolved by: {selectedDispute.resolved_by_user.full_name} on{" "}
                {formatDate(
                  //@ts-ignore

                  selectedDispute.resolved_at
                )}
              </p>
            )}
          </div>
        )}

      {/* Footer buttons */}
      {availableActions.length > 0 && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            type="button"
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !reviewForm.notes.trim()}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {reviewForm.action === "start_review" && "Start Review"}
                {reviewForm.action === "approve_review" && "Approve Review"}
                {reviewForm.action === "resolve" && "Resolve Dispute"}
                {reviewForm.action === "dismiss" && "Dismiss Dispute"}
              </>
            )}
          </button>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size evidence"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onError={() => {
                setImageLoadErrors((prev) => new Set(prev).add(selectedImage));
              }}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <a
              href={selectedImage}
              download
              className="absolute bottom-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
