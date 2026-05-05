import { Profile } from "./profile";

export type UserRole = "worker" | "customer";

export type SendMessageData = {
  job_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  file_url?: string | null;
  type: "text" | "attachement" | "voice";
  file_size?: number | null;
};
export type Job = {
  id: string;
  title: string;
  description: string;
  customer_id: string;
  worker_id: string | null;
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  price: number; // Keep for backward compatibility
  location: string;
  images?: string[];
  created_at: string;
  urgency?: string;
  level_required?: string;
  skills?: string[];
  category?: string;
  building_access?: string;
  project_size?: string;
  date?: string;
  time_slot?: string;
  materials_provided?: boolean;
  pay_type?: "fixed" | "range" | "hourly"; // Added from your schema
  fixed_rate?: number; // For fixed pay_type
  min_rate?: number; // For range pay_type
  max_rate?: number; // For range pay_type
  hourly_rate?: number; // For hourly pay_type
  coi_url?: string;
};

export type Customer = Profile & {
  rating?: number;
  jobs_posted?: number;
  member_since?: string;
  company_name?: string;
  company_logo_url?: string;
  business_verified?: boolean;
};

export type Worker = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url?: string | null;
  phone?: string | null;
  job_title?: string | null;
  trade_category?: string | null;
  level?: string | null;
  skills?: string[] | null;
  rating?: number;
  jobs_completed?: number;
  member_since?: string;
  created_at?: string;
};

export type User = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
};

// Dans types/messages.types.ts
export type Conversation = {
  id: string;
  jobId?: string; // Si vous voulez garder jobId, sinon utilisez id
  jobTitle: string;
  otherUser: Profile;
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
  unreadCount: number;
  status: Job["status"];
  price: number;
  location: string;
  createdAt?: string;
  date?: string;
  category?: string;

  // AJOUTER CES CHAMPS DE VOTRE TABLE jobs
  pay_type?: string | null;
  fixed_rate?: number | null;
  min_rate?: number | null;
  max_rate?: number | null;
  hourly_rate?: number | null;
  jobDetails?: {
    description?: string;
    images?: string[];
    urgency?: string;
    level_required?: string;
    skills?: string[];
    category?: string;
  };
};
export type CurrentUser = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
};
