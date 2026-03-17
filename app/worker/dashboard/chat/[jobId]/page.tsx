"use client";

import { useParams } from "next/navigation";
import { ChatHeader } from "./components/ChatHeader";
import { JobStatusBar } from "./components/JobStatusBar";
import { MessageList } from "./components/MessageList";
import { MessageInput } from "./components/MessageInput";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { useChat } from "@/lib/hooks/useChat";

export default function WorkerChatPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const {
    messages,
    job,
    customer,
    currentUser,
    loading,
    sending,
    error,
    hasApplied,
    isTyping,
    sendMessage,
    applyForJob,
    setIsTyping,
  } = useChat(jobId);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !job) {
    return <ErrorState error={error || "Job not found"} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ChatHeader customer={customer} job={job} customerId={job.customer_id} />

      <JobStatusBar job={job} hasApplied={hasApplied} onApply={applyForJob} />

      <MessageList
        messages={messages}
        customer={customer}
        customerId={job.customer_id}
        currentUser={currentUser}
      />

      <MessageInput
        onSendMessage={sendMessage}
        isSending={sending}
        onTyping={setIsTyping}
      />
    </div>
  );
}
