import { supabase } from "./supabase";

/* ======================================================
   TYPES
====================================================== */

export type NotificationType =
  | "application"
  | "message"
  | "job_status"
  | "payment"
  | "review";

export type JobStatus = "assigned" | "in_progress" | "completed" | "cancelled";

export type NotificationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "assigned"
  | "in_progress"
  | "cancelled";

export interface NotificationData {
  job_id?: string;
  application_id?: string;
  worker_id?: string;
  customer_id?: string;
  status?: NotificationStatus;
  amount?: number;
  rating?: number;
  category?: string;
  location?: string;
  budget?: number;
  [key: string]: any;
}

/* ======================================================
   CORE FUNCTION
====================================================== */

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  content: string,
  data: NotificationData = {}
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      content,
      data,
      read: false,
    });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
};

/* ======================================================
   NOTIFICATION HELPERS
====================================================== */

/**
 * New Job Application
 */
export const notifyNewApplication = async (
  customerId: string,
  jobTitle: string,
  workerName: string,
  jobId: string
) => {
  return createNotification(
    customerId,
    "application",
    "New Application 📝",
    `${workerName} applied to your job "${jobTitle}"`,
    { job_id: jobId }
  );
};

/**
 * Application Accepted
 */
export const notifyApplicationAccepted = async (
  workerId: string,
  jobTitle: string,
  jobId: string,
  clientName?: string
) => {
  return createNotification(
    workerId,
    "application",
    "Application Accepted! 🎉",
    clientName
      ? `${clientName} accepted your application for "${jobTitle}"`
      : `Your application for "${jobTitle}" has been accepted!`,
    {
      job_id: jobId,
      status: "accepted",
    }
  );
};

/**
 * Application Rejected
 */
export const notifyApplicationRejected = async (
  workerId: string,
  jobTitle: string,
  jobId: string
) => {
  return createNotification(
    workerId,
    "application",
    "Application Update",
    `Your application for "${jobTitle}" was not selected`,
    {
      job_id: jobId,
      status: "rejected",
    }
  );
};

/**
 * New Job Posted
 */
export const notifyNewJobPosted = async (
  workerId: string,
  jobTitle: string,
  category: string,
  location: string,
  budget: number,
  jobId: string,
  clientName: string
) => {
  return createNotification(
    workerId,
    "job_status",
    "New Job Opportunity! 🔨",
    `${clientName} posted a new ${category} job: "${jobTitle}" in ${location} - Budget: $${budget}`,
    {
      job_id: jobId,
      category,
      location,
      budget,
    }
  );
};

/**
 * New Message
 */
export const notifyNewMessage = async (
  userId: string,
  senderName: string,
  jobTitle: string,
  jobId: string,
  messagePreview: string
) => {
  const preview =
    messagePreview.length > 40
      ? messagePreview.slice(0, 40) + "..."
      : messagePreview;

  return createNotification(
    userId,
    "message",
    `New Message from ${senderName} 💬`,
    `Regarding "${jobTitle}": ${preview}`,
    { job_id: jobId }
  );
};

/**
 * Job Status Changed
 */
export const notifyJobStatusChanged = async (
  userId: string,
  jobTitle: string,
  newStatus: JobStatus,
  jobId: string,
  userRole: "customer" | "worker"
) => {
  const statusMessages: Record<JobStatus, string> = {
    assigned:
      userRole === "customer"
        ? "A worker has been assigned to your job"
        : "You have been assigned to a job",
    in_progress: "Job is now in progress",
    completed: "Job has been completed",
    cancelled: "Job has been cancelled",
  };

  const statusEmojis: Record<JobStatus, string> = {
    assigned: "👤",
    in_progress: "⚙️",
    completed: "✅",
    cancelled: "❌",
  };

  return createNotification(
    userId,
    "job_status",
    `Job ${statusEmojis[newStatus]}`,
    `"${jobTitle}" - ${statusMessages[newStatus]}`,
    {
      job_id: jobId,
      status: newStatus,
    }
  );
};

/**
 * Payment Released
 */
export const notifyPaymentReleased = async (
  workerId: string,
  jobTitle: string,
  amount: number,
  jobId: string
) => {
  return createNotification(
    workerId,
    "payment",
    "Payment Received! 💰",
    `You received $${amount} for "${jobTitle}"`,
    {
      job_id: jobId,
      amount,
    }
  );
};

/**
 * New Review
 */
export const notifyNewReview = async (
  userId: string,
  reviewerName: string,
  jobTitle: string,
  rating: number,
  jobId: string
) => {
  const stars = "⭐".repeat(rating);

  return createNotification(
    userId,
    "review",
    "New Review! ⭐",
    `${reviewerName} gave you ${stars} for "${jobTitle}"`,
    {
      job_id: jobId,
      rating,
    }
  );
};

/* ======================================================
   MANAGEMENT FUNCTIONS
====================================================== */

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return false;
  }
};

/**
 * Cleanup old notifications
 */
export const cleanupOldNotifications = async (
  daysToKeep: number = 30
): Promise<boolean> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
    return false;
  }
};
