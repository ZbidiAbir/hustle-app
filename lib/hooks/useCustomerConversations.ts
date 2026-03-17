import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Conversation, Worker } from "@/types/chat";
import { getWorkerDisplayName } from "@/utils/chat.utils";

export function useCustomerConversations(userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchConversations = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);

      try {
        // Get all jobs where user is customer and has assigned worker
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select(
            "id, title, status, price, location, worker_id, description, images, urgency, level_required, skills, created_at"
          )
          .eq("customer_id", userId)
          .not("worker_id", "is", null)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;

        if (!jobsData || jobsData.length === 0) {
          setConversations([]);
          return;
        }

        // Get worker profiles with all details
        const workerIds = jobsData.map((job) => job.worker_id);
        const { data: workersData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", workerIds);

        const workersMap = new Map(workersData?.map((w) => [w.id, w]) || []);

        // Build conversations with last message and unread count
        const conversationsData = await Promise.all(
          jobsData.map(async (job) => {
            const worker = workersMap.get(job.worker_id);

            // Get last message
            const { data: lastMsgData } = await supabase
              .from("messages")
              .select("*")
              .eq("job_id", job.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            // Count unread messages
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("job_id", job.id)
              .eq("read", false)
              .neq("sender_id", userId);

            return {
              id: job.id,
              jobId: job.id,
              jobTitle: job.title,
              worker: {
                ...worker,
                full_name: worker?.full_name || "Worker",
                email: worker?.email || "",
                rating: 4.8,
                jobs_completed: 78,
                job_title: worker?.job_title,
                trade_category: worker?.trade_category,
                level: worker?.level,
                skills: worker?.skills,
              },
              lastMessage: lastMsgData
                ? {
                    content: lastMsgData.content,
                    created_at: lastMsgData.created_at,
                    sender_id: lastMsgData.sender_id,
                    read: lastMsgData.read,
                  }
                : undefined,
              unreadCount: count || 0,
              status: job.status,
              price: job.price,
              location: job.location,
              createdAt: job.created_at,
              jobDetails: {
                description: job.description,
                images: job.images,
                urgency: job.urgency,
                level_required: job.level_required,
                skills: job.skills,
              },
            };
          })
        );

        setConversations(conversationsData);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(
      (conv) =>
        conv.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getWorkerDisplayName(conv.worker)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        conv.worker.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  const markAsRead = useCallback(
    async (conversationId: string) => {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("job_id", conversationId)
        .neq("sender_id", userId);
    },
    [userId]
  );

  return {
    conversations,
    filteredConversations,
    loading,
    isRefreshing,
    searchTerm,
    setSearchTerm,
    fetchConversations,
    markAsRead,
  };
}
