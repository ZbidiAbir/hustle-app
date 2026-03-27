export type Application = {
  id: string;
  job_id: string;
  worker_id?: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  job?: Job;
  worker?: WorkerProfile;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  status: string;
  created_at: string;
  start_date?: string;
  end_date?: string;
  requirements?: string[];
  images?: string[];
};

export type WorkerProfile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  zip_code?: string;
  job_title?: string;
  trade_category?: string;
  level?: "beginner" | "intermediate" | "expert" | "master" | null;
  skills?: string[];
  rate_type?: "hourly" | "fixed" | "project" | null;
  hourly_rate?: number;
  bank_name?: string;
  bank_account_holder?: string;
  bank_account_number?: string;
  bank_routing_number?: string;
  insurance_url?: string;
  insurance_verified?: boolean;
  rating?: number;
  reviews_count?: number;
  jobs_completed?: number;
  verified?: boolean;
  created_at: string;
};

export type Dispute = {
  id: string;
  job_id: string;
  created_by: string;
  against_user: string;
  type: string;
  description: string;
  preferred_resolution: string;
  evidence: string[];
  status: string;
  created_at: string;
  updated_at: string;
};
