import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/contexts/ToastContext";

export function useDispute(
  jobId: string | undefined,
  userId: string | undefined
) {
  const [disputeType, setDisputeType] = useState<string>("quality");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [preferredResolution, setPreferredResolution] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [existingDisputeId, setExistingDisputeId] = useState<string | null>(
    null
  );
  const [existingDisputeStatus, setExistingDisputeStatus] = useState<
    string | null
  >(null);
  const toast = useToast();

  const fetchExistingDispute = useCallback(async () => {
    if (!jobId || !userId) return null;

    try {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .eq("job_id", jobId)
        .eq("created_by", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingDisputeId(data.id);
        setExistingDisputeStatus(data.status);
        setIsUpdating(true);
        setDisputeType(data.type);
        setDisputeDescription(data.description);
        setPreferredResolution(data.preferred_resolution);
        setEvidenceUrls(data.evidence || []);
        return data;
      } else {
        resetForm();
        return null;
      }
    } catch (error) {
      console.error("Error fetching existing dispute:", error);
      return null;
    }
  }, [jobId, userId]);

  const resetForm = useCallback(() => {
    setDisputeType("quality");
    setDisputeDescription("");
    setPreferredResolution("");
    setEvidenceFiles([]);
    setEvidenceUrls([]);
    setIsUpdating(false);
    setExistingDisputeId(null);
    setExistingDisputeStatus(null);
  }, []);

  const uploadEvidence = useCallback(
    async (files: FileList | null) => {
      if (!files || !jobId) return;

      const newFiles = Array.from(files);
      setEvidenceFiles((prev) => [...prev, ...newFiles]);
      setUploadingEvidence(true);

      try {
        const uploadedUrls: string[] = [];

        for (const file of newFiles) {
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`${file.name} exceeds 10MB limit`);
            continue;
          }

          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`;
          const filePath = `disputes/${jobId}/${fileName}`;

          const { error } = await supabase.storage
            .from("dispute-evidence")
            .upload(filePath, file);

          if (error) {
            console.error("Error uploading evidence:", error);
            toast.error(`Failed to upload ${file.name}`);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("dispute-evidence").getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        }

        setEvidenceUrls((prev) => [...prev, ...uploadedUrls]);
        if (uploadedUrls.length > 0) {
          toast.success(`${uploadedUrls.length} file(s) uploaded successfully`);
        }
      } catch (error) {
        console.error("Error uploading evidence:", error);
        toast.error("Failed to upload some files");
      } finally {
        setUploadingEvidence(false);
      }
    },
    [jobId, toast]
  );

  const removeEvidence = useCallback((index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submitDispute = useCallback(
    async (againstUserId: string) => {
      if (!jobId || !userId) {
        toast.error("Missing job or user information");
        return false;
      }

      if (!disputeDescription.trim()) {
        toast.error("Please describe the issue");
        return false;
      }

      if (!preferredResolution.trim()) {
        toast.error("Please specify your preferred resolution");
        return false;
      }

      setSubmittingDispute(true);

      try {
        const { error } = await supabase.from("disputes").insert({
          job_id: jobId,
          created_by: userId,
          against_user: againstUserId,
          type: disputeType,
          description: disputeDescription.trim(),
          preferred_resolution: preferredResolution.trim(),
          evidence: evidenceUrls,
          status: "pending",
        });

        if (error) throw error;

        toast.success(
          "Dispute filed successfully! Our team will review it shortly."
        );
        resetForm();
        return true;
      } catch (error: any) {
        console.error("Error filing dispute:", error);
        if (error.code === "23505") {
          toast.error("You have already filed a dispute for this job");
          await fetchExistingDispute();
        } else {
          toast.error(`Failed to file dispute: ${error.message}`);
        }
        return false;
      } finally {
        setSubmittingDispute(false);
      }
    },
    [
      jobId,
      userId,
      disputeType,
      disputeDescription,
      preferredResolution,
      evidenceUrls,
      toast,
      resetForm,
      fetchExistingDispute,
    ]
  );

  const updateDispute = useCallback(async () => {
    if (!existingDisputeId) {
      toast.error("No existing dispute found to update");
      return false;
    }

    if (!disputeDescription.trim()) {
      toast.error("Please describe the issue");
      return false;
    }

    if (!preferredResolution.trim()) {
      toast.error("Please specify your preferred resolution");
      return false;
    }

    setSubmittingDispute(true);

    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          type: disputeType,
          description: disputeDescription.trim(),
          preferred_resolution: preferredResolution.trim(),
          evidence: evidenceUrls,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingDisputeId);

      if (error) throw error;

      toast.success("Dispute updated successfully!");
      resetForm();
      return true;
    } catch (error: any) {
      console.error("Error updating dispute:", error);
      toast.error(`Failed to update dispute: ${error.message}`);
      return false;
    } finally {
      setSubmittingDispute(false);
    }
  }, [
    existingDisputeId,
    disputeType,
    disputeDescription,
    preferredResolution,
    evidenceUrls,
    toast,
    resetForm,
  ]);

  return {
    // State
    disputeType,
    setDisputeType,
    disputeDescription,
    setDisputeDescription,
    preferredResolution,
    setPreferredResolution,
    evidenceFiles,
    evidenceUrls,
    uploadingEvidence,
    submittingDispute,
    isUpdating,
    existingDisputeStatus,
    // Actions
    fetchExistingDispute,
    uploadEvidence,
    removeEvidence,
    submitDispute,
    updateDispute,
    resetForm,
  };
}
