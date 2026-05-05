import { Profile } from "../../../types/profile";
import { MessageType } from "../enums/chat.enum";

export type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  content: string | null;
  type:
    | MessageType.TEXT
    | MessageType.AUDIO
    | MessageType.IMAGE
    | MessageType.FILE
    | MessageType.LINK;
  attachments: [] | null;
  duration?: number;
  waveform?: number[];
  created_at: string;

  // file_url?: string;
  // file_name?: string;
  // file_size?: string;
};

export type VoiceMessageType = {
  audioBlob?: Blob;
  waveformData?: number[];
  duration?: number;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  customer_id: string;
  worker_id: string | null; // <- worker_id est requis ici
  category: string;
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  price: number;
  location: string;
  images?: string[];
  created_at: string;
  urgency?: string;
  level_required?: string;
  skills?: string[];
  pay_type?: string;
  fixed_rate?: number;
  min_rate?: number;
  max_rate?: number;
  hourly_rate?: number;
};

export type Customer = Profile & {
  rating?: number;
  jobs_posted?: number;
  member_since?: string;
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
  customer: Customer;
  worker: Worker;
  pay_type?: string; // Ajouter pay_type
  fixed_rate?: number; // Ajouter fixed_rate
  min_rate?: number; // Ajouter min_rate
  max_rate?: number; // Ajouter max_rate
  hourly_rate?: number; // Ajouter hourly_rate
  category?: string; // Ajouter category

  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
  unreadCount: number;
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  price: number;
  location: string;
  createdAt: string;
  jobDetails?: {
    description?: string;
    images?: string[];
    urgency?: string;
    level_required?: string;
    skills?: string[];
  };
};
