"use client";

import { useParams } from "next/navigation";
import { ChatHeader } from "../../../../../components/chat/ChatHeader";
import { JobStatusBar } from "../../../../../components/chat/JobStatusBar";
import { LoadingState } from "../../../../../components/chat/LoadingState";
import { ErrorState } from "../../../../../components/chat/ErrorState";
import { useChat } from "@/lib/hooks/useChat";
import MessageInput from "@/components/chat/MessageInput";
import { useCallback, useEffect, useState } from "react";
import { chatService } from "@/lib/chat.service";
import { MessageList } from "@/components/chat/MessageList";
import { getConversation } from "@/modules/chat/actions/getConversation";
import { Customer } from "@/types/messages.types";
import { getCurrentUser } from "@/lib/common/currentUser";

export default function WorkerChatPage() {
  const params = useParams();
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const conversationId = params.conversationId as string;
  console.log(conversationId);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchConversation() {
      try {
        const convo = await getConversation(conversationId);
        setConversation(convo);
        setLoading(false);
      } catch (err) {
        console.log(err);
        setError("Failed to fetch conversation");
        setLoading(false);
      }
    }
    fetchConversation();
  }, [conversationId]);

  // const sendMessage = useCallback(
  //   async (
  //     content: string | null,
  //     type: "text" | "audio" | "attachement" = "text",
  //     file_url?: string,
  //     file_name?: string,
  //     file_size?: number,
  //     waveFormData?: number[],
  //     duration?: number,
  //   ) => {
  //     if (!currentUser || !job) return;

  //     const safeFileUrl = file_url ?? null;
  //     const safeFileName = file_name ?? null;
  //     const safeFileSize = file_size ?? null;
  //     const safeWaveForm = waveFormData ?? null;
  //     const safeDurattion = duration ?? null;

  //     try {
  //       await chatService.sendMessage(
  //         conversationId,
  //         currentUser.id,
  //         content,
  //         safeFileUrl,
  //         safeFileName,
  //         safeFileSize,
  //         safeWaveForm,
  //         safeDurattion,
  //         type,
  //       );
  //     } catch (err: unknown) {
  //       console.log(err);
  //     } finally {
  //       console.log("typing");
  //     }
  //   },
  //   [conversationId, currentUser, job],
  // );

  const job = conversation?.jobs || null;

  useEffect(() => {
    async function fetchCustomer(customerId: string) {
      try {
        const customerData = await chatService.getCustomer(customerId);
        setCustomer(customerData);
      } catch (error) {
        console.log("Error fetching customer:", error);
      }
    }
    if (job?.customer_id) {
      fetchCustomer(job.customer_id);
    }
  }, [job]);

  if (loading) {
    return <LoadingState />;
  }
  console.log(conversation);

  if (error || !job) {
    return <ErrorState error={error || "Job not found"} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ChatHeader customer={customer} job={job} />

      <JobStatusBar job={job} />

      <MessageList
        customer={customer}
        currentUser={currentUser}
        conversationId={conversationId}
      />

      <MessageInput
        onSendMessage={sendMessage}
        conversationId={conversationId}
        senderId={currentUser?.id as string}
        isSending={false}
      />
    </div>
  );
}
