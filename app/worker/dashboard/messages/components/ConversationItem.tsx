import { formatConversationTime } from "@/modules/chat/utils/chat";
import { Conversation } from "@/modules/chat/types/chat.types";
import {
  getAvatarColor,
  getCustomerDisplayName,
  getCustomerAvatar,
} from "@/utils/chat.utils";
import { Check } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: string;
  onSelect: () => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  currentUserId,
  onSelect,
}: ConversationItemProps) {
  const customerDisplayName = getCustomerDisplayName(conversation.customer);
  const customerAvatar = getCustomerAvatar(conversation.customer);
  const isBusiness = conversation.customer.account_type === "smallbusiness";
  const isUnread = conversation.unreadCount > 0;
  const lastMessageIsMine =
    conversation.lastMessage?.sender_id === currentUserId;

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition border-b border-gray-100 ${
        isSelected ? "bg-purple-50" : ""
      } ${isUnread ? "bg-blue-50/30" : ""}`}
    >
      {/* Avatar with company logo if available */}
      <div className="relative shrink-0">
        <div
          className={`w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm ${
            customerAvatar
              ? ""
              : `bg-linear-to-r ${getAvatarColor(conversation.customer.id)}`
          }`}
        >
          {customerAvatar ? (
            customerAvatar
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
              {customerDisplayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Unread count badge */}
        {isUnread && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-xs text-white font-medium">
              {conversation.unreadCount}
            </span>
          </div>
        )}

        {/* Business badge */}
        {isBusiness && conversation.customer.business_verified && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <h3
              className={`font-semibold truncate ${
                isUnread ? "text-gray-900" : "text-gray-700"
              }`}
            >
              {customerDisplayName}
            </h3>
          </div>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-400 shrink-0">
              {formatConversationTime(conversation.lastMessage.created_at)}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 truncate mb-1">
          Job: {conversation.jobTitle}
        </p>

        {conversation.lastMessage && (
          <p
            className={`text-xs truncate flex items-center gap-1 ${
              isUnread ? "text-gray-900 font-medium" : "text-gray-600"
            }`}
          >
            {lastMessageIsMine && (
              <span className="text-purple-600">You: </span>
            )}
            {conversation.lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
}
