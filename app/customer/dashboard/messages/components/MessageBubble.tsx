import { Check, CheckCheck } from "lucide-react";
import { Avatar } from "./Avatar";
import { messageUtils } from "@/utils/messages.utils";

interface MessageBubbleProps {
  message: any;
  isMine: boolean;
  otherUser: any;
  showAvatar: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  otherUser,
  showAvatar,
}) => {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[70%] ${
          isMine ? "flex-row-reverse" : "flex-row"
        } items-end gap-2`}
      >
        <div
          className={`rounded-2xl px-4 py-2 ${
            isMine
              ? "bg-purple-600 text-white"
              : "bg-white border border-gray-200"
          }`}
        >
          {!isMine && showAvatar && (
            <p className="text-xs font-medium text-gray-500 mb-1">
              {otherUser.full_name}
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-xs ${
              isMine ? "text-purple-200" : "text-gray-400"
            }`}
          >
            <span>{messageUtils.formatMessageTime(message.created_at)}</span>
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
        </div>
      </div>
    </div>
  );
};
