import clsx from "clsx";
import { MessageStatus } from "../types/message";
import { formatMessageTime } from "@/utils/chat.utils";
import { MessageStatusIcon } from "./MessageStatusIcon";

interface MessageTimeProps {
  timestamp?: Date | string;
  isMe: boolean;
  status?: MessageStatus;
}

export const MessageTime = ({ timestamp, isMe, status }: MessageTimeProps) => {
  if (!timestamp) return null;

  const normalizedDate =
    timestamp instanceof Date ? timestamp : new Date(timestamp);
  return (
    <div className="flex justify-end items-center gap-1">
      <span
        className={clsx(
          "text-xs font-medium",
          isMe ? "text-theme-primary-100" : "text-text-tertiary",
        )}
      >
        {formatMessageTime(normalizedDate)}
      </span>
      {isMe && <MessageStatusIcon status={status} />}
    </div>
  );
};
