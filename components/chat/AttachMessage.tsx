import { Image, Video, FileText, LucideProps } from "lucide-react";

// TODO change the message type

interface AttachMessageProps {
  onClose: () => void;
  onPickFile: (
    accept: string,
    messageType: "image" | "video" | "attachement" | undefined,
  ) => void;
}

export const ATTACH_OPTIONS: {
  label: string;
  acceptLabel: string;
  icon: React.ComponentType<LucideProps>;
  accept: string;
  messageType: "image" | "video" | "attachement";
}[] = [
  {
    label: "Upload Photo",
    acceptLabel: "PNG, JPG up to 10MB",
    icon: Image,
    accept: "image/*",
    messageType: "image",
  },
  {
    label: "Upload Video",
    acceptLabel: "MP4, MOV up to 100MB",
    icon: Video,
    accept: "video/*",
    messageType: "video",
  },
  {
    label: "Upload File",
    acceptLabel: "PDF, DOC, XLS, etc.",
    icon: FileText,
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip",
    messageType: "attachement",
  },
];

export const AttachMessage = ({ onClose, onPickFile }: AttachMessageProps) => {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute bottom-14 left-2 mb-2 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-1 flex flex-col gap-0.5 min-w-32.5">
        {ATTACH_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.label}
              onClick={() => {
                onPickFile(option.accept, option.messageType);
                onClose();
              }}
              className="flex gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Icon size={16} className="text-theme-primary mt-1" />
              <div className="flex flex-col items-start">
                <span>{option.label}</span>
                <p className="text-xs text-text-tertiary">
                  {option.acceptLabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};
