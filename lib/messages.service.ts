import { supabase } from "@/lib/supabase";
import { Message } from "@/modules/chat/types/chat.types";
import { Conversation, SendMessageData } from "@/types/messages.types";
import { Profile } from "@/types/profile";

export const messageService = {
  // Récupérer l'utilisateur courant

  // Récupérer toutes les conversations
  async fetchConversations(userId: string): Promise<Conversation[]> {
    // Récupérer les jobs où l'utilisateur est impliqué
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select(
        `
        id, 
        title, 
        status, 
        price, 
        location, 
        date, 
        customer_id, 
        worker_id, 
        pay_type, 
        fixed_rate, 
        min_rate, 
        max_rate, 
        hourly_rate,
        created_at,
        category
      `,
      )
      .or(`customer_id.eq.${userId},worker_id.eq.${userId}`)
      .not("worker_id", "is", null)
      .order("created_at", { ascending: false });

    if (jobsError) throw jobsError;
    if (!jobs?.length) return [];

    // Récupérer les conversations avec les détails
    const conversations = await Promise.all(
      jobs.map(async (job) => {
        const otherUserId =
          job.customer_id === userId ? job.worker_id : job.customer_id;

        const [otherUser, lastMessage, unreadCount] = await Promise.all([
          this.fetchUserProfile(otherUserId),
          this.fetchLastMessage(job.id),
          this.fetchUnreadCount(job.id, userId),
        ]);

        return {
          id: job.id,
          jobId: job.id,
          jobTitle: job.title,
          otherUser,
          lastMessage: lastMessage || undefined,
          unreadCount,
          status: job.status,
          price: job.price,
          location: job.location,
          date: job.date,
          createdAt: job.created_at,
          pay_type: job.pay_type,
          fixed_rate: job.fixed_rate,
          min_rate: job.min_rate,
          max_rate: job.max_rate,
          hourly_rate: job.hourly_rate,
          category: job.category,
        };
      }),
    );

    return conversations as Conversation[];
  },

  // Récupérer le profil d'un utilisateur
  async fetchUserProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return {
      ...data,
      avatar_url: data.avatar_url || null,
    } as Profile;
  },

  // Récupérer le dernier message d'un job - CORRIGÉ
  async fetchLastMessage(jobId: string) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last message:", error);
        return null;
      }

      // Retourner le premier message s'il existe, sinon null
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error("Error in fetchLastMessage:", error);
      return null;
    }
  },

  // Compter les messages non lus
  async fetchUnreadCount(jobId: string, userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("job_id", jobId)
        .eq("read", false)
        .neq("sender_id", userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  },

  // Récupérer les messages d'une conversation
  async fetchMessages(
    jobId: string,
    currentUserId: string,
  ): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  },

  // Marquer les messages comme lus
  async markMessagesAsRead(jobId: string, userId: string) {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("job_id", jobId)
        .neq("sender_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  // Envoyer un message
  async sendMessage(messageData: SendMessageData) {
    try {
      const { error } = await supabase.from("messages").insert([messageData]);
      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // S'abonner aux nouveaux messages
  subscribeToMessages(jobId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => callback(payload.new as Message),
      )
      .subscribe();
  },
};
