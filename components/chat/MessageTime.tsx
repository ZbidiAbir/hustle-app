import { Check, CheckCheck } from "lucide-react";
import { Message } from "@/modules/chat/types/chat.types";
import clsx from "clsx";
import { formatMessageTime } from "@/modules/chat/utils/chat";

interface MessageTimeProps {
  isMine: boolean;
  message: Message;
}

export const MessageTime = ({ isMine, message }: MessageTimeProps) => {
  console.log(message);
  return (
    <div
      className={clsx("flex items-center justify-end gap-1 mt-1 text-xs", {
        "text-purple-200": isMine,
        "text-gray-400": !isMine,
      })}
    >
      <span>{formatMessageTime(message.created_at)}</span>
      {isMine && (
        <span>
          {message.read ? (
            <CheckCheck className="w-3 h-3" />
          ) : (
            <Check className="w-3 h-3" />
          )}
        </span>
      )}
    </div>
  );
};
