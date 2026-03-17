import { Profile } from "@/types/profile";

export type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  images: string[];
  created_at: string;
  customer_id: string;
  status: string;

  // Nouveaux champs du schéma
  building_access?: string;
  project_size?: string;
  urgency?: string;
  date?: string;
  time_slot?: string;
  level_required?: string;
  skills?: string[];
  materials_provided?: boolean;
  pay_type?: string;
  fixed_rate?: number;
  min_rate?: number;
  max_rate?: number;
  hourly_rate?: number;
  coi_url?: string;
  worker_id?: string | null;
  updated_at?: string;
};

export type Customer = Profile & {
  rating?: number;
  jobs_posted?: number;
  member_since?: string;
};

export type Application = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  created_at: string;
};

export type DisplayPrice = {
  amount: number | string;
  label: string;
};
