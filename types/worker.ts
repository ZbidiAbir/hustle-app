export type WorkerDetails = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  phone?: string;
  bio?: string;
  role: "worker";

  // Informations professionnelles
  profession: string;
  skills: string[];
  experience_years: number;
  hourly_rate: number;
  completed_jobs: number;
  rating: number;
  review_count: number;

  // Disponibilité
  availability: "available" | "busy" | "unavailable";
  available_days?: string[];

  // Localisation
  location: string;
  service_area?: string[];

  // Vérifications
  verified: boolean;
  verified_at?: string;

  // Documents
  id_verified?: boolean;
  background_check?: boolean;

  // Statistiques
  response_rate: number;
  response_time: string; // ex: "Moins d'1 heure"

  // Réseaux sociaux / Contact
  website?: string;
  social_links?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };

  created_at: string;
  updated_at: string;
};

export type WorkerReview = {
  id: string;
  worker_id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string;
  job_id: string;
  job_title: string;
  rating: number;
  comment: string;
  created_at: string;
  customer_response?: string;
};

export type WorkerPortfolio = {
  id: string;
  worker_id: string;
  title: string;
  description?: string;
  image_url: string;
  category: string;
  created_at: string;
};

export type WorkerCertification = {
  id: string;
  worker_id: string;
  name: string;
  issuer: string;
  issued_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
};
