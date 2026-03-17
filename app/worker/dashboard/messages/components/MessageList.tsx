import { Message, Customer } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { getCustomerAvatar } from "@/utils/chat.utils";
import { Loader2 } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  currentUserId: string;
  customer: Customer | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({
  messages,
  loading,
  currentUserId,
  customer,
  messagesEndRef,
}: MessageListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const isMine = message.sender_id === currentUserId;
        const showAvatar =
          !isMine &&
          (index === 0 || messages[index - 1]?.sender_id !== message.sender_id);

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isMine={isMine}
            showAvatar={showAvatar}
            //@ts-ignore
            senderName={customer?.full_name}
            senderAvatar={customer ? getCustomerAvatar(customer) : undefined}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
