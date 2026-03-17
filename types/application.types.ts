import { Profile } from "@/types/profile";

export type ApplicationStatus = "pending" | "accepted" | "rejected";
export type JobStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";
export type FilterType = "all" | "pending" | "accepted" | "rejected";
export type SortOption = "newest" | "oldest" | "price_high" | "price_low";
export type ViewMode = "grid" | "list";

export type Application = {
  id: string;
  job_id: string;
  message: string;
  status: ApplicationStatus;
  created_at: string;
  job: {
    id: string;
    title: string;
    category: string;
    price: number;
    location: string;
    status: JobStatus;
    customer_id: string;
    urgency?: string;
    level_required?: string;
    images?: string[];
  };
  customer?: Profile & {
    company_name?: string;
    company_logo_url?: string;
    company_phone?: string;
    company_email?: string;
    business_description?: string;
    business_website?: string;
    business_verified?: boolean;
    business_year_founded?: number;
    business_employees_count?: string;
    business_address?: string;
    business_city?: string;
    business_country?: string;
    business_zip_code?: string;
    tax_id?: string;
    business_registration_number?: string;
  };
};

export type ApplicationStats = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  successRate: number;
};

export type StatusConfig = {
  icon: any;
  text: string;
  bg: string;
  textColor: string;
  border: string;
  iconColor: string;
  dot: string;
  gradient: string;
  lightBg: string;
};
