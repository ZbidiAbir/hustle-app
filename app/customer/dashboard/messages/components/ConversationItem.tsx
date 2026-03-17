import { Conversation } from "@/types/messages.types";
import { Check, CheckCheck } from "lucide-react";
import { Avatar } from "./Avatar";
import { messageUtils } from "@/utils/messages.utils";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: string;
  onSelect: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  currentUserId,
  onSelect,
}) => {
  const lastMessage = conversation.lastMessage;
  const isLastMessageFromMe = lastMessage?.sender_id === currentUserId;

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition border-b border-gray-100 ${
        isSelected ? "bg-purple-50" : ""
      }`}
    >
      <img
        //@ts-ignore
        src={conversation.otherUser.avatar_url}
        alt=""
        className="w-10 h-10 rounded-full"
      />

      <div className="flex-1 min-w-0">
        <div className="flex justify-between ">
          <h3 className="font-semibold text-gray-900 truncate text-xs">
            {conversation.otherUser.full_name} ({conversation.jobTitle})
          </h3>
          {lastMessage && (
            <span className="text-xs text-gray-400 shrink-0">
              {messageUtils.formatMessageTime(lastMessage.created_at)}
            </span>
          )}
        </div>

        {lastMessage && (
          <p className="text-xs text-gray-600 truncate flex items-center gap-1">
            {isLastMessageFromMe && (
              <span className="text-purple-600 flex items-center gap-0.5">
                {lastMessage.read ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                You:
              </span>
            )}
            {lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
};
