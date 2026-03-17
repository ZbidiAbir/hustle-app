import { supabase } from "@/lib/supabase";
import { Application } from "@/types/application.types";

export const applicationsService = {
  async fetchApplications(workerId: string): Promise<Application[]> {
    // Fetch applications with job details
    const { data, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        job:jobs!inner(
          id,
          title,
          category,
          price,
          location,
          status,
          customer_id,
          urgency,
          level_required,
          images
        )
      `
      )
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch customer profiles for each job
    const customerIds = data?.map((app) => app.job.customer_id) || [];

    if (customerIds.length === 0) return data || [];

    const { data: customersData, error: customersError } = await supabase
      .from("profiles")
      .select(
        `
        id, 
        full_name, 
        email, 
        avatar_url, 
        phone,
        account_type,
        company_name,
        company_logo_url,
        company_phone,
        company_email,
        business_description,
        business_website,
        business_verified,
        business_year_founded,
        business_employees_count,
        business_address,
        business_city,
        business_country,
        business_zip_code,
        tax_id,
        business_registration_number
      `
      )
      .in("id", customerIds);

    if (customersError) throw customersError;

    const customersMap = new Map(customersData?.map((c) => [c.id, c]) || []);

    return (data || []).map((app) => ({
      ...app,
      customer: customersMap.get(app.job.customer_id),
    }));
  },

  async withdrawApplication(applicationId: string): Promise<void> {
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", applicationId);

    if (error) throw error;
  },

  async bulkWithdrawApplications(applicationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from("applications")
      .delete()
      .in("id", applicationIds);

    if (error) throw error;
  },
};
