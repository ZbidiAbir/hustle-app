// services/adminSettings.service.ts
import { supabase } from "@/lib/supabase";

export interface AdminSettings {
  // Général
  siteName: string;
  siteDescription: string;
  siteLogo?: string;
  contactEmail?: string;
  contactPhone?: string;
  supportEmail?: string;
  supportPhone?: string;

  // Platform
  platformFee: number;
  platformFeeType: "percentage" | "fixed";
  minimumWithdrawal: number;
  maximumWithdrawal: number;
  withdrawalDays: string[];

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  adminEmailAlerts: boolean;

  // Sécurité
  twoFactorAuth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: "standard" | "strong" | "very_strong";

  // Modération
  autoModerateJobs: boolean;
  autoModerateReviews: boolean;
  disputeReviewTime: number;
  maxDisputeEvidenceFiles: number;
  maxDisputeFileSize: number;

  // Apparence
  theme: "light" | "dark" | "system";
  primaryColor: string;
  accentColor: string;
  logoPosition: "left" | "center" | "right";

  // Jobs
  defaultJobExpiration: number;
  maxJobImages: number;
  allowedJobCategories: string[];
  minJobPrice: number;
  maxJobPrice: number;

  // Messaging
  maxMessageLength: number;
  messageRetentionDays: number;
  allowMessageAttachments: boolean;
  maxAttachmentSize: number;

  // Paiements
  paymentGateway: "stripe" | "paypal" | "both";
  stripePublicKey?: string;
  stripeSecretKey?: string;
  paypalClientId?: string;
  paypalSecret?: string;
  currency: string;
  currencySymbol: string;

  // Analytics
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  enableAnalytics: boolean;
}

// Valeurs par défaut (utilisées seulement si la base est vide)
const DEFAULT_SETTINGS: AdminSettings = {
  siteName: "TaskFlow",
  siteDescription: "Connect skilled professionals with clients",
  contactEmail: "contact@taskflow.com",
  contactPhone: "+1 (555) 123-4567",
  supportEmail: "support@taskflow.com",
  supportPhone: "+1 (555) 987-6543",
  platformFee: 10,
  platformFeeType: "percentage",
  minimumWithdrawal: 50,
  maximumWithdrawal: 10000,
  withdrawalDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  adminEmailAlerts: true,
  twoFactorAuth: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordPolicy: "strong",
  autoModerateJobs: true,
  autoModerateReviews: true,
  disputeReviewTime: 48,
  maxDisputeEvidenceFiles: 10,
  maxDisputeFileSize: 10,
  theme: "system",
  primaryColor: "#3b82f6",
  accentColor: "#8b5cf6",
  logoPosition: "left",
  defaultJobExpiration: 30,
  maxJobImages: 10,
  allowedJobCategories: [
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Cleaning",
    "Gardening",
    "Moving",
  ],
  minJobPrice: 50,
  maxJobPrice: 10000,
  maxMessageLength: 5000,
  messageRetentionDays: 365,
  allowMessageAttachments: true,
  maxAttachmentSize: 10,
  paymentGateway: "stripe",
  currency: "USD",
  currencySymbol: "$",
  enableAnalytics: false,
};

export const adminSettingsService = {
  // Récupérer l'admin actuel
  async getCurrentAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, role, settings")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching admin:", error);
      return null;
    }

    return profile;
  },

  // Récupérer les settings (données réelles de la base)
  async getSettings(): Promise<AdminSettings> {
    try {
      const admin = await this.getCurrentAdmin();

      // Vérifier si l'utilisateur est admin
      if (!admin || admin.role !== "admin") {
        console.log("User is not admin, returning default settings");
        return DEFAULT_SETTINGS;
      }

      // Si pas de settings dans la base, retourner les defaults
      if (!admin.settings || Object.keys(admin.settings).length === 0) {
        console.log("No settings found in DB, using defaults");
        return DEFAULT_SETTINGS;
      }

      // Fusionner les settings de la base avec les defaults
      const mergedSettings = { ...DEFAULT_SETTINGS, ...admin.settings };
      console.log("Loaded settings from DB:", mergedSettings);
      return mergedSettings;
    } catch (error) {
      console.error("Error fetching settings:", error);
      return DEFAULT_SETTINGS;
    }
  },

  // Mettre à jour les settings dans la base
  async updateSettings(
    settings: Partial<AdminSettings>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const admin = await this.getCurrentAdmin();

      if (!admin || admin.role !== "admin") {
        return {
          success: false,
          error: "Unauthorized: Only admins can update settings",
        };
      }

      // Récupérer les settings actuels
      const currentSettings = admin.settings || DEFAULT_SETTINGS;
      const updatedSettings = { ...currentSettings, ...settings };

      console.log("Updating settings in DB:", updatedSettings);

      const { error } = await supabase
        .from("profiles")
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", admin.id);

      if (error) {
        console.error("Error updating settings:", error);
        return { success: false, error: error.message };
      }

      console.log("Settings updated successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Error in updateSettings:", error);
      return { success: false, error: error.message };
    }
  },

  // Récupérer une valeur spécifique
  async getSetting<K extends keyof AdminSettings>(
    key: K
  ): Promise<AdminSettings[K] | null> {
    const settings = await this.getSettings();
    return settings[key] ?? null;
  },

  // Mettre à jour une valeur spécifique
  async updateSetting<K extends keyof AdminSettings>(
    key: K,
    value: AdminSettings[K]
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateSettings({ [key]: value });
  },

  // Fonction pour forcer le rechargement des settings
  async refreshSettings(): Promise<AdminSettings> {
    return this.getSettings();
  },
};
