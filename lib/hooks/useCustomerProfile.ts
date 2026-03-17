import { useState, useEffect } from "react";
import {
  Profile,
  CustomerPersonalForm,
  CustomerCompanyForm,
  CustomerPaymentForm,
} from "@/types/profile";
import { useUser } from "./useUser";
import { customerProfileService } from "../profile-services/customer-profile.service";

export function useCustomerProfile() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await customerProfileService.getProfile(user!.id);
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
      showError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  const updateBasicInfo = async (info: CustomerPersonalForm) => {
    if (!user) return;
    try {
      setSaving(true);
      await customerProfileService.updateBasicInfo(user.id, info);
      await loadProfile();
      showSuccess("Personal information updated successfully");
    } catch (error) {
      console.error("Error updating personal info:", error);
      showError("Failed to update personal information");
    } finally {
      setSaving(false);
    }
  };

  const updateCompanyInfo = async (info: CustomerCompanyForm) => {
    if (!user) return;
    try {
      setSaving(true);
      await customerProfileService.updateCompanyInfo(user.id, info);
      await loadProfile();
      showSuccess("Company information updated successfully");
    } catch (error) {
      console.error("Error updating company info:", error);
      showError("Failed to update company information");
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentInfo = async (info: CustomerPaymentForm) => {
    if (!user) return;
    try {
      setSaving(true);
      await customerProfileService.updatePaymentInfo(user.id, info);
      await loadProfile();
      showSuccess("Payment information updated successfully");
    } catch (error) {
      console.error("Error updating payment info:", error);
      showError("Failed to update payment information");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    try {
      setUploading(true);
      await customerProfileService.uploadAvatar(user.id, file);
      await loadProfile();
      showSuccess("Avatar uploaded successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showError("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const uploadCompanyLogo = async (file: File) => {
    if (!user) return;
    try {
      setUploadingLogo(true);
      await customerProfileService.uploadCompanyLogo(user.id, file);
      await loadProfile();
      showSuccess("Company logo uploaded successfully");
    } catch (error) {
      console.error("Error uploading company logo:", error);
      showError("Failed to upload company logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    try {
      setSaving(true);
      await customerProfileService.removeAvatar(user.id, profile.avatar_url);
      await loadProfile();
      showSuccess("Avatar removed successfully");
    } catch (error) {
      console.error("Error removing avatar:", error);
      showError("Failed to remove avatar");
    } finally {
      setSaving(false);
    }
  };

  const removeCompanyLogo = async () => {
    if (!user || !profile?.company_logo_url) return;
    try {
      setSaving(true);
      await customerProfileService.removeCompanyLogo(
        user.id,
        profile.company_logo_url
      );
      await loadProfile();
      showSuccess("Company logo removed successfully");
    } catch (error) {
      console.error("Error removing company logo:", error);
      showError("Failed to remove company logo");
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    uploading,
    uploadingLogo,
    successMessage,
    errorMessage,
    updateBasicInfo,
    updateCompanyInfo,
    updatePaymentInfo,
    uploadAvatar,
    uploadCompanyLogo,
    removeAvatar,
    removeCompanyLogo,
  };
}
