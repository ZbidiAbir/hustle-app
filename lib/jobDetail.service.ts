import { supabase } from "@/lib/supabase";
import { Job } from "@/types/job";
import { Application, Customer } from "@/types/jobDetail";

export const jobDetailService = {
  async getJob(jobId: string): Promise<Job> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Job not found");

    return data;
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
      rating: 4.8, // À remplacer par de vraies données
      jobs_posted: 24, // À remplacer par de vraies données
    };
  },

  async getApplication(
    jobId: string,
    workerId: string
  ): Promise<Application | null> {
    const { data } = await supabase
      .from("applications")
      .select("id, status, message, created_at")
      .eq("job_id", jobId)
      .eq("worker_id", workerId)
      .maybeSingle();

    return data;
  },

  async applyForJob(
    jobId: string,
    workerId: string,
    message: string
  ): Promise<void> {
    const { error } = await supabase.from("applications").insert([
      {
        job_id: jobId,
        worker_id: workerId,
        message: message.trim(),
        status: "pending",
      },
    ]);

    if (error) throw error;
  },

  async getWorkerName(workerId: string): Promise<string> {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", workerId)
      .maybeSingle();

    return data?.full_name || "A worker";
  },
};
