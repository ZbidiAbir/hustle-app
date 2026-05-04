"use client";

import { useParams } from "next/navigation";
import { ChatHeader } from "./components/ChatHeader";
import { JobStatusBar } from "./components/JobStatusBar";
import { MessageList } from "./components/MessageList";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { useChat } from "@/lib/hooks/useChat";
import MessageInput from "@/app/components/MessageInput";
import { useCallback } from "react";
import { chatService } from "@/lib/chat.service";

export default function WorkerChatPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const {
    messages,
    job,
    customer,
    currentUser,
    loading,
    // sending,
    error,
    hasApplied,
    // isTyping,
    // sendMessage,
    applyForJob,
    // setIsTyping,
  } = useChat(jobId);

  const sendMessage = useCallback(
    async (
      content: string | null,
      type: "text" | "audio" | "attachement" = "text",
      file_url?: string,
      file_name?: string,
      file_size?: number,
    ) => {
      if (!currentUser || !job) return;

      const safeFileUrl = file_url ?? null;
      const safeFileName = file_name ?? null;
      const safeFileSize = file_size ?? null;

      try {
        await chatService.sendMessage(
          jobId,
          currentUser.id,
          content,
          safeFileUrl,
          safeFileName,
          safeFileSize,
          type,
        );
      } catch (err: unknown) {
        console.log(err);
      } finally {
        console.log("typing");
      }
    },
    [jobId, currentUser, job],
  );

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
        jobId={jobId}
        senderId={currentUser?.id as string}
        isSending={false}
      />

      {/* <MessageInput
        onSendMessage={sendMessage}
        isSending={sending}
        onTyping={setIsTyping}
      /> */}
    </div>
  );
}
