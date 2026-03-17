export interface Profile {
  id: string;
  email: string;
  role: "worker" | "customer" | "admin";
  account_type: "homeowner" | "smallbusiness" | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  zip_code: string | null;

  // Champs worker (existants)
  job_title: string | null;
  trade_category: string | null;
  level: string | null;
  skills: string[] | null;
  rate_type: "hourly" | "fixed" | "project" | null;
  hourly_rate: number | null;
  bank_name: string | null;
  bank_account_holder: string | null;
  bank_account_number: string | null;
  bank_routing_number: string | null;
  insurance_url: string | null;
  insurance_verified: boolean | null;

  // Informations de paiement
  payment_method: "credit_card" | "debit_card" | "bank_transfer" | null;
  card_last_four: string | null;
  card_expiry_date: string | null;
  card_holder_name: string | null;

  // INFORMATIONS ENTREPRISE (pour smallbusiness)
  company_name: string | null;
  company_logo_url: string | null;
  company_phone: string | null;
  company_email: string | null;
  tax_id: string | null;
  business_address: string | null;
  business_city: string | null;
  business_country: string | null;
  business_zip_code: string | null;
  business_website: string | null;
  business_registration_number: string | null;
  business_description: string | null;
  business_year_founded: number | null;
  business_employees_count: "1-10" | "11-50" | "51-200" | "200+" | null;
  business_verified: boolean | null;

  // Métadonnées
  metadata: Record<string, any> | null;

  created_at: string;
  updated_at: string;
}

export interface WorkExperience {
  id: string;
  worker_id: string;
  company_name: string;
  location: string | null;
  position: string;
  employment_type: "full-time" | "part-time" | "contract" | "internship";
  start_date: string;
  end_date: string | null;
  current: boolean;
  description: string | null;
  created_at: string;
}

export type EmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship";
export type RateType = "hourly" | "fixed" | "project" | null;
export type TabType = "info" | "experience" | "payment" | "insurance";
export type AccountType = "homeowner" | "smallbusiness" | null;
export type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | null;

export interface BasicInfoForm {
  full_name: string;
  phone: string;
  address: string;
  city: string;
}

export interface ProfessionalForm {
  job_title: string;
  trade_category: string;
  level: string;
  skills: string[];
}

export interface PaymentForm {
  rate_type: RateType;
  hourly_rate: number;
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  bank_routing_number: string;
}

export interface ExperienceForm {
  company_name: string;
  location: string;
  position: string;
  employment_type: EmploymentType;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
}

// Types pour les formulaires customer
export interface CustomerPersonalForm {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zip_code: string;
}

export interface CustomerCompanyForm {
  company_name: string;
  company_phone: string;
  company_email: string;
  business_address: string;
  business_city: string;
  business_country: string;
  business_zip_code: string;
  tax_id: string;
  business_registration_number: string;
  business_website: string;
  business_description: string;
  business_year_founded: number | null;
  business_employees_count: "1-10" | "11-50" | "51-200" | "200+" | null;
}

export interface CustomerPaymentForm {
  payment_method: PaymentMethod;
  card_last_four: string;
  card_expiry_date: string;
  card_holder_name: string;
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  bank_routing_number: string;
}
