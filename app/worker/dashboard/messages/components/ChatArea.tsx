import {
  Conversation,
  Customer,
  Message,
} from "@/modules/chat/types/chat.types";
import { ChatHeader } from "./ChatHeader";
import { JobInfoBar } from "./JobInfoBar";
import { CompanyDetails } from "./CompanyDetails";
import MessageInput from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { EmptyChat } from "@/components/chat/EmptyChat";

interface ChatAreaProps {
  conversation: Conversation | null;
  customer: Customer | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  currentUserId: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSendMessage: (content: string) => Promise<void>;
  onBack: () => void;
  onInfoClick: () => void;
  showCompanyDetails: boolean;
  onToggleCompanyDetails: () => void;
}

export function ChatArea({
  conversation,
  customer,
  messages,
  loading,
  sending,
  currentUserId,
  messagesEndRef,
  onSendMessage,
  onBack,
  onInfoClick,
  showCompanyDetails,
  onToggleCompanyDetails,
}: ChatAreaProps) {
  if (!conversation || !customer) {
    return <EmptyChat />;
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <ChatHeader
        conversation={conversation}
        customer={customer}
        onBack={onBack}
        onInfoClick={onToggleCompanyDetails}
      />

      <JobInfoBar conversation={conversation} />

      {showCompanyDetails && (
        <div className="px-4 pt-2">
          <CompanyDetails customer={customer} />
        </div>
      )}

      <MessageList
        messages={messages}
        loading={loading}
        currentUserId={currentUserId}
        customer={customer}
        messagesEndRef={messagesEndRef}
      />

      <MessageInput />
    </div>
  );
}
