// lib/profile-services/profile.service.ts
import { supabase } from "@/lib/supabase";
import {
  Profile,
  BasicInfoForm,
  ProfessionalForm,
  PaymentForm,
} from "@/types/profile";

export const ProfileService = {
  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  async getWorkerProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    if (data.role !== "worker") throw new Error("User is not a worker");
    return data;
  },

  async updateBasicInfo(userId: string, data: BasicInfoForm) {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
  },

  async updateProfessionalInfo(userId: string, data: ProfessionalForm) {
    const { error } = await supabase
      .from("profiles")
      .update({
        job_title: data.job_title,
        trade_category: data.trade_category,
        level: data.level,
        skills: data.skills,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
  },

  async updatePaymentInfo(userId: string, data: PaymentForm) {
    const { error } = await supabase
      .from("profiles")
      .update({
        rate_type: data.rate_type,
        hourly_rate: data.hourly_rate,
        bank_name: data.bank_name,
        bank_account_holder: data.bank_account_holder,
        bank_account_number: data.bank_account_number,
        bank_routing_number: data.bank_routing_number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
  },

  // Upload avatar pour worker
  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      // Valider le fichier
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed");
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File size must be less than 2MB");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Supprimer l'ancien avatar s'il existe
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const oldFiles = existingFiles.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("avatars").remove(oldFiles);
      }

      // Uploader le nouveau fichier
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Mettre à jour le profil avec la nouvelle URL d'avatar
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  },

  // Supprimer l'avatar
  async removeAvatar(userId: string, avatarUrl: string): Promise<void> {
    try {
      const urlParts = avatarUrl.split("/avatars/");
      if (urlParts.length < 2) {
        throw new Error("Invalid avatar URL");
      }

      const filePath = urlParts[1];

      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error removing avatar:", error);
      throw error;
    }
  },

  async uploadInsurance(userId: string, file: File): Promise<string> {
    try {
      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files are allowed");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `insurance-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("worker-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("worker-documents").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          insurance_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      return publicUrl;
    } catch (error) {
      console.error("Error uploading insurance:", error);
      throw error;
    }
  },

  async removeInsurance(userId: string): Promise<void> {
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          insurance_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error removing insurance:", error);
      throw error;
    }
  },
};
