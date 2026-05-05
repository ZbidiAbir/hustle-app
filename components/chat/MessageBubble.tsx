import { Customer, Message } from "@/modules/chat/types/chat.types";
import { getCustomerAvatar } from "@/utils/chat.utils";
import MessageWrapper from "./MessageWrapper";
import { MessageTime } from "./MessageTime";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  customer: Customer | null;
  showAvatar: boolean;
}

export function MessageBubble({
  message,
  isMine,
  customer,
  showAvatar,
}: MessageBubbleProps) {
  const senderName = customer?.full_name || null;
  const senderAvatar = getCustomerAvatar(customer);
  return (
    <MessageWrapper
      isMine={isMine}
      showAvatar={showAvatar}
      senderName={senderName}
      senderAvatar={senderAvatar}
      message={message}
    >
      <div
        className={`rounded-2xl px-4 py-2 ${
          isMine
            ? "bg-purple-600 text-white"
            : "bg-white border border-gray-200"
        }`}
      >
        {!isMine && showAvatar && senderName && (
          <p className="text-xs font-medium text-gray-500 mb-1">{senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap wrap-break-word">
          {message.content}
        </p>
        <MessageTime isMine={isMine} message={message} />
      </div>
    </MessageWrapper>
  );
}
