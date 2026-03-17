import { Check, CheckCheck } from "lucide-react";

import { CustomerAvatar } from "./CustomerAvatar";
import { Customer, Message, User } from "@/types/chat";
import { formatMessageTime } from "@/utils/chat.utils";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar: boolean;
  customer: Customer | null;
  customerId: string;
  currentUser: User | null;
}

export function MessageBubble({
  message,
  isMine,
  showAvatar,
  customer,
  customerId,
  currentUser,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[70%] ${
          isMine ? "flex-row-reverse" : "flex-row"
        } items-end gap-2`}
      >
        {/* Avatar for other user */}
        {!isMine && showAvatar && (
          <CustomerAvatar
            customer={customer}
            customerId={customerId}
            size="sm"
            showStatus={false}
          />
        )}
        {!isMine && !showAvatar && <div className="w-8 h-8 shrink-0" />}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isMine
              ? "bg-purple-600 text-white"
              : "bg-white border border-gray-200"
          }`}
        >
          {!isMine && showAvatar && (
            <p className="text-xs font-medium text-gray-500 mb-1">
              {customer?.full_name || customer?.company_name || "Customer"}
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap wrap-break-word">
            {message.content}
          </p>
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-xs ${
              isMine ? "text-purple-200" : "text-gray-400"
            }`}
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
        </div>

        {/* My Avatar */}
        {isMine && (
          <div className="w-8 h-8 rounded-full bg-linear-to-r from-green-500 to-purple-500 shrink-0 flex items-center justify-center text-white text-xs font-medium shadow-sm">
            {currentUser?.email?.charAt(0).toUpperCase() || "M"}
          </div>
        )}
      </div>
    </div>
  );
}
