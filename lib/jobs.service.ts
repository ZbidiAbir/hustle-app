import { supabase } from "@/lib/supabase";
import { Job } from "@/types/job";

export const jobsService = {
  async fetchJobs(userId?: string): Promise<Job[]> {
    // Fetch all open jobs avec TOUS les champs
    const { data: jobsData, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (jobsError) throw jobsError;

    // Fetch customer profiles avec tous les champs nécessaires
    const customerIds = jobsData?.map((job) => job.customer_id) || [];
    const { data: customersData } = await supabase
      .from("profiles")
      .select(
        `
        id, 
        full_name, 
        email, 
        avatar_url,
        account_type,
        company_name,
        company_logo_url,
        business_verified
      `
      )
      .in("id", customerIds);

    const customersMap = new Map(customersData?.map((c) => [c.id, c]) || []);

    // If user is logged in, fetch their applications
    let applicationsMap = new Map();
    if (userId) {
      const { data: applicationsData } = await supabase
        .from("applications")
        .select("job_id, status, created_at")
        .eq("worker_id", userId);

      applicationsMap = new Map(
        applicationsData?.map((app) => [
          app.job_id,
          { status: app.status, applied_at: app.created_at },
        ]) || []
      );
    }

    // Combine jobs with customer info and application status
    return (jobsData || []).map((job) => ({
      ...job,
      customer: customersMap.get(job.customer_id) || {
        full_name: "Client",
        email: "client@email.com",
        account_type: null,
        company_name: null,
        company_logo_url: null,
      },
      application_status: applicationsMap.get(job.id)?.status || null,
      applied_at: applicationsMap.get(job.id)?.applied_at || null,
    }));
  },
};
