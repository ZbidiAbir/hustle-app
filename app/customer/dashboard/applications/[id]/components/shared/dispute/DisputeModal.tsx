import {
  Gavel,
  X,
  Paperclip,
  FileText,
  AlertTriangle,
  Wrench,
  Shield,
  Clock,
  HelpCircle,
  X as XIcon,
} from "lucide-react";
import { useIconsAndBadges } from "../../../hooks/useIconsAndBadges";

const DISPUTE_TYPES = [
  {
    value: "quality",
    label: "Work Quality Issues",
    icon: Wrench,
    description:
      "Disagreements about the quality or completeness of the work performed.",
  },
  {
    value: "safety",
    label: "Safety Concerns",
    icon: Shield,
    description:
      "Worker is not following proper safety procedures while on the job.",
  },
  {
    value: "timeline",
    label: "Worker No-Show",
    icon: Clock,
    description: "The assigned worker did not arrive at the job location.",
  },
  {
    value: "property_damage",
    label: "Damage to property",
    icon: AlertTriangle,
    description: "The worker caused damage to your property during the job.",
  },
  {
    value: "other",
    label: "Other Issues",
    icon: HelpCircle,
    description: "Other issues not covered above",
  },
];

export function DisputeModal({
  workerName,
  jobTitle,
  disputeType,
  setDisputeType,
  disputeDescription,
  setDisputeDescription,
  preferredResolution,
  setPreferredResolution,
  evidenceFiles,
  evidenceUrls,
  onUploadEvidence,
  onRemoveEvidence,
  uploadingEvidence,
  submittingDispute,
  onSubmit,
  onClose,
  isUpdating = false,
  existingDisputeStatus = null,
}: {
  workerName: string;
  jobTitle: string;
  disputeType: string;
  setDisputeType: (type: any) => void;
  disputeDescription: string;
  setDisputeDescription: (desc: string) => void;
  preferredResolution: string;
  setPreferredResolution: (resolution: string) => void;
  evidenceFiles: File[];
  evidenceUrls: string[];
  onUploadEvidence: (files: FileList | null) => void;
  onRemoveEvidence: (index: number) => void;
  uploadingEvidence: boolean;
  submittingDispute: boolean;
  onSubmit: () => void;
  onClose: () => void;
  isUpdating?: boolean;
  existingDisputeStatus?: string | null;
}) {
  const { getDisputeStatusColor } = useIconsAndBadges();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Gavel className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isUpdating ? "Update Dispute" : "File a Dispute"}
              </h2>
              <p className="text-sm text-gray-500">
                {isUpdating
                  ? "Update your existing dispute"
                  : `Against ${workerName} for ${jobTitle}`}
              </p>
              {existingDisputeStatus && (
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${getDisputeStatusColor(
                    existingDisputeStatus
                  )}`}
                >
                  Current Status: {existingDisputeStatus}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Important Information
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Please provide accurate and truthful information. False
                  disputes may result in account penalties. Our team will review
                  your dispute and contact both parties within 2-3 business
                  days.
                </p>
              </div>
            </div>
          </div>

          {/* Dispute Type */}
          <DisputeTypeSelector
            disputeType={disputeType}
            setDisputeType={setDisputeType}
          />

          {/* Description */}
          <TextAreaField
            label="Description of Issue"
            value={disputeDescription}
            onChange={setDisputeDescription}
            rows={4}
            placeholder="Please provide a detailed description of what happened, including dates, times, and specific issues..."
          />

          {/* Preferred Resolution */}
          <TextAreaField
            label="Preferred Resolution"
            value={preferredResolution}
            onChange={setPreferredResolution}
            rows={3}
            placeholder="What would you like to happen? (e.g., refund, redo work, partial payment, etc.)"
          />

          {/* Evidence Upload */}
          <EvidenceUpload
            evidenceFiles={evidenceFiles}
            evidenceUrls={evidenceUrls}
            onUpload={onUploadEvidence}
            onRemove={onRemoveEvidence}
            uploading={uploadingEvidence}
          />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={
              submittingDispute ||
              !disputeDescription.trim() ||
              !preferredResolution.trim()
            }
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submittingDispute ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {isUpdating ? "Updating..." : "Submitting..."}
              </>
            ) : (
              <>
                <Gavel className="w-4 h-4" />
                {isUpdating ? "Update Dispute" : "Submit Dispute"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sous-composants du modal
function DisputeTypeSelector({
  disputeType,
  setDisputeType,
}: {
  disputeType: string;
  setDisputeType: (type: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Dispute Type <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DISPUTE_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = disputeType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => setDisputeType(type.value)}
              className={`p-3 rounded-lg border-2 text-left transition ${
                isSelected
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? "text-red-600" : "text-gray-500"
                  }`}
                />
                <span
                  className={`font-medium ${
                    isSelected ? "text-red-900" : "text-gray-700"
                  }`}
                >
                  {type.label}
                </span>
              </div>
              <p className="text-xs text-gray-500">{type.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
      />
    </div>
  );
}

function EvidenceUpload({
  evidenceFiles,
  evidenceUrls,
  onUpload,
  onRemove,
  uploading,
}: {
  evidenceFiles: File[];
  evidenceUrls: string[];
  onUpload: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  uploading: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Evidence (Optional)
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={(e) => onUpload(e.target.files)}
          className="hidden"
          id="evidence-upload"
          disabled={uploading}
        />
        <label
          htmlFor="evidence-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Paperclip className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-600">
            {uploading ? "Uploading..." : "Click to upload files"}
          </span>
          <span className="text-xs text-gray-400">
            Images, PDFs, or documents (max 10MB each)
          </span>
        </label>
      </div>

      {(evidenceFiles.length > 0 || evidenceUrls.length > 0) && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-500">Uploaded Files:</p>
          {evidenceFiles.map((file, index) => (
            <EvidenceItem
              key={index}
              name={file.name}
              size={file.size}
              onRemove={() => onRemove(index)}
            />
          ))}
          {evidenceUrls.map((url, index) => (
            <EvidenceUrlItem
              key={index}
              url={url}
              onRemove={() => onRemove(index + evidenceFiles.length)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceItem({
  name,
  size,
  onRemove,
}: {
  name: string;
  size: number;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Paperclip className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600 truncate max-w-[200px]">
          {name}
        </span>
        <span className="text-xs text-gray-400">
          ({(size / 1024 / 1024).toFixed(2)} MB)
        </span>
      </div>
      <button
        onClick={onRemove}
        className="p-1 hover:bg-gray-200 rounded text-red-500"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function EvidenceUrlItem({
  url,
  onRemove,
}: {
  url: string;
  onRemove: () => void;
}) {
  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        {isImage ? (
          <img
            src={url}
            alt="Evidence"
            className="w-8 h-8 rounded object-cover"
          />
        ) : (
          <FileText className="w-4 h-4 text-gray-400" />
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-purple-600 hover:underline truncate max-w-[200px]"
        >
          {url.split("/").pop() || "View file"}
        </a>
      </div>
      <button
        onClick={onRemove}
        className="p-1 hover:bg-gray-200 rounded text-red-500"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
