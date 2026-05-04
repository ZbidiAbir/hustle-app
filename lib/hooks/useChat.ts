import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Customer, Job, Message } from "@/types/chat";
import { chatService } from "../chat.service";
// import { User as SupabaseUser } from "@supabase/supabase-js"; // Importer le type Supabase

// Définir un type pour l'utilisateur de l'application
type AppUser = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
};

export function useChat(jobId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null); // Utiliser AppUser
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Transformer l'utilisateur Supabase en AppUser
        const appUser: AppUser = {
          id: user.id,
          email: user.email || "",
          user_metadata: user.user_metadata,
        };
        setCurrentUser(appUser);

        const jobData = await chatService.getJob(jobId);
        setJob(jobData as Job); // Cast explicite

        const customerData = await chatService.getCustomer(jobData.customer_id);
        setCustomer(customerData);

        const application = await chatService.getApplication(jobId, user.id);
        setHasApplied(!!application);

        const messagesData = await chatService.getMessages(jobId);
        setMessages(messagesData);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) init();
  }, [jobId, router]);

  useEffect(() => {
    if (!jobId || !currentUser) return;

    const subscription = chatService.subscribeToMessages(jobId, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [jobId, currentUser]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !currentUser || !job) return;

      setSending(true);
      try {
        await chatService.sendMessage(jobId, currentUser.id, content);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setSending(false);
      }
    },
    [jobId, currentUser, job],
  );

  const applyForJob = useCallback(async () => {
    if (!currentUser || !job) return;

    try {
      await chatService.applyForJob(jobId, currentUser.id);
      setHasApplied(true);
    } catch (err: any) {
      setError(err.message);
    }
  }, [jobId, currentUser, job]);

  return {
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
  };
}
