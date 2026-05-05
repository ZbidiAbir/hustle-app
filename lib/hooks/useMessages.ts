import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Message } from "@/modules/chat/types/chat.types";
import { chatService } from "../chat.service";

export function useMessages(
  jobId: string,
  currentUserId: string,
  customerName: string,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await chatService.getMessages(jobId);

      // Add sender names
      const messagesWithNames = data.map((msg) => {
        const isMine = msg.sender_id === currentUserId;
        return {
          ...msg,
          sender_name: isMine ? "You" : customerName,
        };
      });

      setMessages(messagesWithNames);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [jobId, currentUserId, customerName]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const subscription = chatService.subscribeToMessages(jobId, (newMsg) => {
      setMessages((prev) => [
        ...prev,
        {
          ...newMsg,
          sender_name:
            newMsg.sender_id === currentUserId ? "You" : customerName,
        },
      ]);

      // Mark as read if it's from the other user
      if (newMsg.sender_id !== currentUserId) {
        supabase.from("messages").update({ read: true }).eq("id", newMsg.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [jobId, currentUserId, customerName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setSending(true);
      try {
        await chatService.sendMessage(jobId, currentUserId, content);
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setSending(false);
      }
    },
    [jobId, currentUserId],
  );

  const markAllAsRead = useCallback(async () => {
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("job_id", jobId)
      .neq("sender_id", currentUserId);
  }, [jobId, currentUserId]);

  return {
    messages,
    loading,
    sending,
    messagesEndRef,
    sendMessage,
    markAllAsRead,
  };
}
