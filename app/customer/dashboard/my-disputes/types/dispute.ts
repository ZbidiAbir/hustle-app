// types/dispute.ts
export type DisputeType =
  | "payment"
  | "quality"
  | "timeline"
  | "communication"
  | "safety"
  | "other";
export type DisputeStatus =
  | "pending"
  | "under_review"
  | "resolved"
  | "dismissed";

export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface Job {
  id: string;
  title: string;
  description?: string;
}

export interface Dispute {
  id: string;
  job_id: string;
  created_by: string;
  against_user: string;
  type: DisputeType;
  description: string;
  preferred_resolution: string;
  evidence: string[];
  status: DisputeStatus;
  resolved_by: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  job?: Job;
  created_by_user?: User;
  against_user_user?: User;
  resolved_by_user?: User;
}

export interface DisputeFormData {
  type: DisputeType;
  description: string;
  preferred_resolution: string;
  evidence: string[];
}

export interface UpdateDisputeData {
  status?: DisputeStatus;
  resolved_by?: string;
  resolution_notes?: string;
  resolved_at?: string;
}
