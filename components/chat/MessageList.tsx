import { useEffect, useRef, useState } from "react";
import { Customer, Message, User } from "@/modules/chat/types/chat.types";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { EmptyChat } from "./EmptyChat";
import VoiceMessage from "./VoiceMessage";
import FilePreviewCard from "./FilePreviewCard";
import { getMessages } from "@/modules/chat/actions/getMessages";
import { toast } from "sonner";

interface MessageListProps {
  customer: Customer | null;
  currentUser: User | null;
  conversationId: string;
}

export function MessageList({
  // messages,
  customer,
  currentUser,
  conversationId,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    async function fetchMessages(conversationId: string) {
      try {
        if (!conversationId) {
          toast.error("Conversation ID is missing");
          return;
        }
        const messages = await getMessages(conversationId);
        setMessages(messages);
      } catch (error) {
        console.log("Error fetching messages:", error);
        toast.error("Failed to fetch messages");
      }
    }
    fetchMessages(conversationId);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyChat customer={customer} />;
  }

  console.log(messages);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isMine = message.sender_id === currentUser?.id;
          console.log(isMine);
          const showAvatar =
            !isMine &&
            (index === 0 ||
              messages[index - 1]?.sender_id !== message.sender_id);

          return message.type === "audio" ? (
            <VoiceMessage
              key={message.id}
              showAvatar={showAvatar}
              isMe={isMine}
              customer={customer}
              message={message}
            />
          ) : message.type === "attachement" ? (
            <FilePreviewCard
              key={message.id}
              message={message}
              isMe={isMine}
              customer={customer}
            />
          ) : (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={isMine}
              showAvatar={showAvatar}
              customer={customer}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
