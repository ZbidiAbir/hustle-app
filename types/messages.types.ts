import { Profile } from "./profile";

export type UserRole = "worker" | "customer";

export type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string | null;
};
export type SendMessageData = {
  job_id: string;
  sender_id: string;
  content: string;
  read: boolean;
};
export type Job = {
  id: string;
  title: string;
  description: string;
  customer_id: string;
  worker_id: string | null;
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  price: number;
  location: string;
  images?: string[];
  created_at: string;
  urgency?: string;
  level_required?: string;
  skills?: string[];
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

export type Conversation = {
  id: string;
  jobId: string;
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
  createdAt: string;
  date?: string;
  jobDetails?: {
    description?: string;
    images?: string[];
    urgency?: string;
    level_required?: string;
    skills?: string[];
  };
};

export type CurrentUser = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
};
