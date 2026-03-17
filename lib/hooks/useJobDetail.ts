import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/contexts/ToastContext";
import { notifyNewApplication } from "@/lib/notifications";
import { Job } from "@/types/job";
import { Application, Customer } from "@/types/jobDetail";
import { jobDetailService } from "../jobDetail.service";

export function useJobDetail(jobId: string) {
  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const fetchJobDetails = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const jobData = await jobDetailService.getJob(jobId);
      setJob(jobData);

      const customerData = await jobDetailService.getCustomer(
        jobData.customer_id
      );
      setCustomer({
        ...customerData,
        member_since: new Date(jobData.created_at).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });

      if (user) {
        const appData = await jobDetailService.getApplication(jobId, user.id);
        if (appData) {
          setApplication(appData);
          setApplicationMessage(appData.message || "");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load job details");
      router.push("/worker/jobs");
    } finally {
      setLoading(false);
    }
  }, [jobId, router, toast]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleApply = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please log in to apply");
      router.push("/login");
      return;
    }

    setApplying(true);

    try {
      await jobDetailService.applyForJob(jobId, user.id, applicationMessage);

      const workerName = await jobDetailService.getWorkerName(user.id);

      if (job && customer) {
        await notifyNewApplication(
          job.customer_id,
          job.title,
          workerName,
          jobId
        );
      }

      toast.success("Application submitted successfully!");
      fetchJobDetails();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setApplying(false);
    }
  }, [
    jobId,
    applicationMessage,
    job,
    customer,
    router,
    fetchJobDetails,
    toast,
  ]);

  return {
    job,
    customer,
    application,
    loading,
    applying,
    applicationMessage,
    selectedImage,
    setApplicationMessage,
    setSelectedImage,
    handleApply,
    fetchJobDetails,
  };
}
