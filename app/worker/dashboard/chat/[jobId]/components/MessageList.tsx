import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { Customer, Message, User } from "@/types/chat";
import { EmptyChat } from "./EmptyChat";
import VoiceMessage from "../../../messages/components/VoiceMessage";

interface MessageListProps {
  messages: Message[];
  customer: Customer | null;
  customerId: string;
  currentUser: User | null;
}

export function MessageList({
  messages,
  customer,
  customerId,
  currentUser,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyChat customer={customer} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isMine = message.sender_id === currentUser?.id;
          const showAvatar =
            !isMine &&
            (index === 0 ||
              messages[index - 1]?.sender_id !== message.sender_id);

          return message.type === "audio" ? (
            <VoiceMessage key={message.id} isMe={isMine} message={message} />
          ) : (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={isMine}
              showAvatar={showAvatar}
              customer={customer}
              customerId={customerId}
              currentUser={currentUser}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
