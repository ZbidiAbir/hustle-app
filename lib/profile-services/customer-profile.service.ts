// lib/services/customer-profile.service.ts
import {
  Profile,
  CustomerPersonalForm,
  CustomerCompanyForm,
  CustomerPaymentForm,
} from "@/types/profile";
import { supabase } from "../supabase";

class CustomerProfileService {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      throw error;
    }
  }

  async updateBasicInfo(
    userId: string,
    info: CustomerPersonalForm
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: info.full_name,
          phone: info.phone,
          address: info.address,
          city: info.city,
          country: info.country,
          zip_code: info.zip_code,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating basic info:", error);
      throw error;
    }
  }

  async updateCompanyInfo(
    userId: string,
    info: CustomerCompanyForm
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: info.company_name,
          company_phone: info.company_phone,
          company_email: info.company_email,
          business_address: info.business_address,
          business_city: info.business_city,
          business_country: info.business_country,
          business_zip_code: info.business_zip_code,
          tax_id: info.tax_id,
          business_registration_number: info.business_registration_number,
          business_website: info.business_website,
          business_description: info.business_description,
          business_year_founded: info.business_year_founded,
          business_employees_count: info.business_employees_count,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating company info:", error);
      throw error;
    }
  }

  async updatePaymentInfo(
    userId: string,
    info: CustomerPaymentForm
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          payment_method: info.payment_method,
          card_last_four: info.card_last_four,
          card_expiry_date: info.card_expiry_date,
          card_holder_name: info.card_holder_name,
          bank_name: info.bank_name,
          bank_account_holder: info.bank_account_holder,
          bank_account_number: info.bank_account_number,
          bank_routing_number: info.bank_routing_number,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating payment info:", error);
      throw error;
    }
  }

  async uploadCompanyLogo(userId: string, file: File): Promise<string> {
    try {
      const bucketName = "company-logos"; // CORRIGÉ: avec 's'

      // Valider le fichier
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/company/${fileName}`;

      console.log(`Uploading to bucket: ${bucketName}, path: ${filePath}`);

      // Supprimer l'ancien logo s'il existe
      const { data: existingFiles } = await supabase.storage
        .from(bucketName) // CORRIGÉ
        .list(`${userId}/company`);

      if (existingFiles && existingFiles.length > 0) {
        const oldFiles = existingFiles.map(
          (f) => `${userId}/company/${f.name}`
        );
        await supabase.storage
          .from(bucketName) // CORRIGÉ
          .remove(oldFiles);
      }

      // Uploader le nouveau fichier
      const { error: uploadError } = await supabase.storage
        .from(bucketName) // CORRIGÉ
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
      } = supabase.storage
        .from(bucketName) // CORRIGÉ
        .getPublicUrl(filePath);

      console.log("File uploaded successfully, public URL:", publicUrl);

      // Mettre à jour le profil avec la nouvelle URL du logo
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          company_logo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      return publicUrl;
    } catch (error) {
      console.error("Error uploading company logo:", error);
      throw error;
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const bucketName = "avatars"; // CORRECT

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
        .from(bucketName)
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const oldFiles = existingFiles.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from(bucketName).remove(oldFiles);
      }

      // Uploader le nouveau fichier
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
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
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

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
  }

  async removeCompanyLogo(userId: string, logoUrl: string): Promise<void> {
    try {
      const bucketName = "company-logos"; // CORRIGÉ: avec 's'
      const urlParts = logoUrl.split(`/${bucketName}/`);
      if (urlParts.length < 2) {
        throw new Error("Invalid logo URL");
      }

      const filePath = urlParts[1];

      const { error: deleteError } = await supabase.storage
        .from(bucketName) // CORRIGÉ
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          company_logo_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error removing company logo:", error);
      throw error;
    }
  }

  async removeAvatar(userId: string, avatarUrl: string): Promise<void> {
    try {
      const bucketName = "avatars";
      const urlParts = avatarUrl.split(`/${bucketName}/`);
      if (urlParts.length < 2) {
        throw new Error("Invalid avatar URL");
      }

      const filePath = urlParts[1];

      const { error: deleteError } = await supabase.storage
        .from(bucketName)
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
  }
}

export const customerProfileService = new CustomerProfileService();
