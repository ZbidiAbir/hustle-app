import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Profile,
  WorkExperience,
  BasicInfoForm,
  ProfessionalForm,
  PaymentForm,
  ExperienceForm,
} from "@/types/profile";
import { WorkExperienceService } from "../profile-services/work-experience.service";
import { ProfileService } from "../profile-services/profile.service";

interface UseWorkerProfileReturn {
  profile: Profile | null;
  workExperience: WorkExperience[];
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  uploadingAvatar: boolean; // Nouveau
  successMessage: string | null;
  errorMessage: string | null;
  updateBasicInfo: (data: BasicInfoForm) => Promise<void>;
  updateProfessionalInfo: (data: ProfessionalForm) => Promise<void>;
  updatePaymentInfo: (data: PaymentForm) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>; // Nouveau
  removeAvatar: () => Promise<void>; // Nouveau
  uploadInsurance: (file: File) => Promise<void>;
  removeInsurance: () => Promise<void>;
  addExperience: (data: ExperienceForm) => Promise<void>;
  updateExperience: (
    experienceId: string,
    data: ExperienceForm
  ) => Promise<void>;
  deleteExperience: (experienceId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useWorkerProfile(): UseWorkerProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false); // Nouveau
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const user = await ProfileService.getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const profileData = await ProfileService.getWorkerProfile(user.id);
      setProfile(profileData);

      const experiences = await WorkExperienceService.getWorkerExperiences(
        user.id
      );
      setWorkExperience(experiences);
    } catch (error) {
      console.error("Error fetching profile:", error);
      showError("Failed to load profile");
      if (error instanceof Error && error.message === "User is not a worker") {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [router, showError]);

  const updateBasicInfo = async (data: BasicInfoForm) => {
    if (!profile) return;

    try {
      setSaving(true);
      await ProfileService.updateBasicInfo(profile.id, data);
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
      showSuccess("Basic information saved successfully!");
    } catch (error) {
      console.error("Error saving basic info:", error);
      showError("Error saving basic information");
    } finally {
      setSaving(false);
    }
  };

  const updateProfessionalInfo = async (data: ProfessionalForm) => {
    if (!profile) return;

    try {
      setSaving(true);
      await ProfileService.updateProfessionalInfo(profile.id, data);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              job_title: data.job_title,
              trade_category: data.trade_category,
              level: data.level,
              skills: data.skills,
            }
          : null
      );
      showSuccess("Professional information saved successfully!");
    } catch (error) {
      console.error("Error saving professional info:", error);
      showError("Error saving professional information");
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentInfo = async (data: PaymentForm) => {
    if (!profile) return;

    try {
      setSaving(true);
      await ProfileService.updatePaymentInfo(profile.id, data);
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
      showSuccess("Payment information saved successfully!");
    } catch (error) {
      console.error("Error saving payment info:", error);
      showError("Error saving payment information");
    } finally {
      setSaving(false);
    }
  };

  // Nouvelle fonction pour uploader l'avatar
  const uploadAvatar = async (file: File) => {
    if (!profile) return;

    try {
      setUploadingAvatar(true);
      const publicUrl = await ProfileService.uploadAvatar(profile.id, file);
      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
      showSuccess("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showError("Error uploading avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Nouvelle fonction pour supprimer l'avatar
  const removeAvatar = async () => {
    if (!profile?.avatar_url) return;

    try {
      setSaving(true);
      await ProfileService.removeAvatar(profile.id, profile.avatar_url);
      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
      showSuccess("Avatar removed successfully!");
    } catch (error) {
      console.error("Error removing avatar:", error);
      showError("Error removing avatar");
    } finally {
      setSaving(false);
    }
  };

  const uploadInsurance = async (file: File) => {
    if (!profile) return;

    try {
      setUploading(true);
      const publicUrl = await ProfileService.uploadInsurance(profile.id, file);
      setProfile((prev) =>
        prev ? { ...prev, insurance_url: publicUrl } : null
      );
      showSuccess("Insurance document uploaded successfully!");
    } catch (error) {
      console.error("Error uploading insurance:", error);
      showError("Error uploading insurance");
    } finally {
      setUploading(false);
    }
  };

  const removeInsurance = async () => {
    if (!profile) return;

    try {
      await ProfileService.removeInsurance(profile.id);
      setProfile((prev) => (prev ? { ...prev, insurance_url: null } : null));
      showSuccess("Insurance document removed");
    } catch (error) {
      console.error("Error removing insurance:", error);
      showError("Error removing insurance");
    }
  };

  const addExperience = async (data: ExperienceForm) => {
    if (!profile) return;

    try {
      const user = await ProfileService.getCurrentUser();
      if (!user) return;

      await WorkExperienceService.createExperience(user.id, data);
      const experiences = await WorkExperienceService.getWorkerExperiences(
        user.id
      );
      setWorkExperience(experiences);
      showSuccess("Experience added successfully!");
    } catch (error) {
      console.error("Error adding experience:", error);
      showError("Error adding experience");
    }
  };

  const updateExperience = async (
    experienceId: string,
    data: ExperienceForm
  ) => {
    try {
      await WorkExperienceService.updateExperience(experienceId, data);
      const user = await ProfileService.getCurrentUser();
      if (user) {
        const experiences = await WorkExperienceService.getWorkerExperiences(
          user.id
        );
        setWorkExperience(experiences);
      }
      showSuccess("Experience updated successfully!");
    } catch (error) {
      console.error("Error updating experience:", error);
      showError("Error updating experience");
    }
  };

  const deleteExperience = async (experienceId: string) => {
    if (!confirm("Are you sure you want to delete this experience?")) return;

    try {
      await WorkExperienceService.deleteExperience(experienceId);
      setWorkExperience((prev) =>
        prev.filter((exp) => exp.id !== experienceId)
      );
      showSuccess("Experience deleted successfully!");
    } catch (error) {
      console.error("Error deleting experience:", error);
      showError("Error deleting experience");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    workExperience,
    loading,
    saving,
    uploading,
    uploadingAvatar, // Nouveau
    successMessage,
    errorMessage,
    updateBasicInfo,
    updateProfessionalInfo,
    updatePaymentInfo,
    uploadAvatar, // Nouveau
    removeAvatar, // Nouveau
    uploadInsurance,
    removeInsurance,
    addExperience,
    updateExperience,
    deleteExperience,
    refreshProfile: fetchProfile,
  };
}
