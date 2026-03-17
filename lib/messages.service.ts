import { supabase } from "@/lib/supabase";
import { Conversation, Message, SendMessageData } from "@/types/messages.types";
import { Profile } from "@/types/profile";

export const messageService = {
  // Récupérer l'utilisateur courant
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Récupérer toutes les conversations
  async fetchConversations(userId: string): Promise<Conversation[]> {
    // Récupérer les jobs où l'utilisateur est impliqué
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select(
        "id, title, status, price, location, date, customer_id, worker_id"
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
          jobTitle: job.title,
          otherUser,
          lastMessage: lastMessage || undefined,
          unreadCount,
          status: job.status,
          price: job.price,
          location: job.location,
          date: job.date,
        };
      })
    );
    //@ts-ignore
    return conversations;
  },

  // Récupérer le profil d'un utilisateur
  async fetchUserProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role")
      .eq("id", userId)
      .single();

    if (error) throw error;
    //@ts-ignore

    return {
      ...data,
      avatar_url: data.avatar_url || null, // Si pas d'avatar, mettre null
    };
  },

  // Récupérer le dernier message d'un job
  async fetchLastMessage(jobId: string) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  // Compter les messages non lus
  async fetchUnreadCount(jobId: string, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("job_id", jobId)
      .eq("read", false)
      .neq("sender_id", userId);

    if (error) throw error;
    return count || 0;
  },

  // Récupérer les messages d'une conversation
  async fetchMessages(
    jobId: string,
    currentUserId: string
  ): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Marquer les messages comme lus
  async markMessagesAsRead(jobId: string, userId: string) {
    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("job_id", jobId)
      .neq("sender_id", userId);

    if (error) throw error;
  },

  // Envoyer un message
  async sendMessage(messageData: SendMessageData) {
    const { error } = await supabase.from("messages").insert([messageData]);

    if (error) throw error;
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
        (payload) => callback(payload.new as Message)
      )
      .subscribe();
  },
};
