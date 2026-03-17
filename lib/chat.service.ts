import { supabase } from "@/lib/supabase";
import { Message, Job, Customer } from "@/types/chat";

export const chatService = {
  async getJob(jobId: string): Promise<Job> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Job not found");

    // S'assurer que le status est du bon type
    return {
      ...data,
      status: data.status as Job["status"],
    };
  },
  async getWorker(workerId: string): Promise<Worker> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", workerId)
      .maybeSingle();

    if (error) throw error;

    return {
      ...data,
      full_name: data?.full_name || "Worker",
      email: data?.email || "",
      rating: 4.8,
      jobs_completed: 78,
      member_since: new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  },
  async getCustomer(customerId: string): Promise<Customer> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();

    if (error) throw error;

    return {
      ...data,
      full_name: data?.full_name || "Client",
      email: data?.email || "",
      rating: 4.8,
      jobs_posted: 24,
      member_since: new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  },

  async getApplication(jobId: string, workerId: string) {
    const { data } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("worker_id", workerId)
      .maybeSingle();

    return data;
  },

  async getMessages(jobId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendMessage(jobId: string, senderId: string, content: string) {
    const { error } = await supabase.from("messages").insert([
      {
        job_id: jobId,
        sender_id: senderId,
        content: content.trim(),
        read: false,
      },
    ]);

    if (error) throw error;
  },

  async applyForJob(jobId: string, workerId: string) {
    const { error } = await supabase.from("applications").insert([
      {
        job_id: jobId,
        worker_id: workerId,
        message: "",
        status: "pending",
      },
    ]);

    if (error) throw error;
  },

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
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },
};
