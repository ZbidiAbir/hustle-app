import { FileText } from "lucide-react";
import MessageWrapper from "./MessageWrapper";
import { Customer, Message } from "@/modules/chat/types/chat.types";
import { getCustomerAvatar } from "@/utils/chat.utils";
import clsx from "clsx";

type FilePreviewCardProps = {
  message: Message;
  isMe: boolean;
  customer: Customer | null;
};

const FilePreviewCard = ({ message, isMe, customer }: FilePreviewCardProps) => {
  if (message.type !== "attachement") return null;
  const { file_name: fileName, file_size: fileSize, file_url: url } = message;
  const senderName = customer?.full_name || null;
  const senderAvatar = getCustomerAvatar(customer);
  return (
    <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
      <MessageWrapper
        showAvatar={false}
        isMine={isMe}
        message={message}
        senderAvatar={senderAvatar}
        senderName={senderName}
      >
        <div
          className={clsx(
            "flex items-start gap-2 p-3 border rounded-xl max-w-78",
            isMe
              ? "bg-theme-primary border-theme-primary-300"
              : "bg-gray-200 border-common-border",
          )}
        >
          <FileText
            size={24}
            className={clsx(
              "shrink-0",
              isMe
                ? "fill-white text-theme-primary"
                : "fill-theme-primary text-white",
            )}
          />
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{fileName}</h3>
            <span
              className={clsx(
                "text-xs font-medium opacity-80",
                isMe ? "text-white" : "text-text-tertiary",
              )}
            >
              {fileSize}
            </span>
          </div>
        </div>
      </MessageWrapper>
    </a>
  );
};

export default FilePreviewCard;
