// lib/notificationService.ts
import { supabase } from "./supabase";

export interface CreateNotificationParams {
  userId: string;
  type: "application" | "message" | "job_status" | "payment" | "review";
  title: string;
  content: string;
  data?: any;
}

export class NotificationService {
  static async createNotification(params: CreateNotificationParams) {
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        content: params.content,
        data: params.data || {},
        read: false,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error creating notification:", error);
      return { success: false, error };
    }
  }

  // Notifications pour les customers
  static async notifyCustomerForApplication(application: any, job: any) {
    return await this.createNotification({
      userId: job.customer_id,
      type: "application",
      title: "Nouvelle candidature reçue",
      content: `${application.worker_name} a postulé à votre offre "${job.title}"`,
      data: {
        applicationId: application.id,
        jobId: job.id,
        workerId: application.worker_id,
        type: "new_application",
      },
    });
  }

  static async notifyCustomerForMessage(message: any, job: any, sender: any) {
    return await this.createNotification({
      userId: job.customer_id,
      type: "message",
      title: "Nouveau message",
      content: `${sender.full_name} vous a envoyé un message concernant "${job.title}"`,
      data: {
        messageId: message.id,
        jobId: job.id,
        senderId: sender.id,
        type: "new_message",
      },
    });
  }

  static async notifyCustomerForJobStatusChange(
    job: any,
    oldStatus: string,
    newStatus: string
  ) {
    let title = "";
    let content = "";

    switch (newStatus) {
      case "assigned":
        title = "Travailleur assigné";
        content = `Un travailleur a été assigné à votre job "${job.title}"`;
        break;
      case "in_progress":
        title = "Travail en cours";
        content = `Le travail sur "${job.title}" a commencé`;
        break;
      case "completed":
        title = "Job terminé";
        content = `Le job "${job.title}" a été marqué comme terminé`;
        break;
      case "cancelled":
        title = "Job annulé";
        content = `Le job "${job.title}" a été annulé`;
        break;
    }

    return await this.createNotification({
      userId: job.customer_id,
      type: "job_status",
      title,
      content,
      data: {
        jobId: job.id,
        oldStatus,
        newStatus,
        type: "job_status_change",
      },
    });
  }

  // Notifications pour les workers
  static async notifyWorkerForNewJob(job: any) {
    return await this.createNotification({
      userId: job.worker_id,
      type: "job_status",
      title: "Nouveau job disponible",
      content: `Une nouvelle mission "${job.title}" correspond à vos compétences`,
      data: {
        jobId: job.id,
        type: "new_job",
      },
    });
  }

  static async notifyWorkerForApplicationStatus(
    application: any,
    job: any,
    status: string
  ) {
    let title = "";
    let content = "";

    switch (status) {
      case "accepted":
        title = "Candidature acceptée";
        content = `Votre candidature pour "${job.title}" a été acceptée`;
        break;
      case "rejected":
        title = "Candidature refusée";
        content = `Votre candidature pour "${job.title}" a été refusée`;
        break;
    }

    return await this.createNotification({
      userId: application.worker_id,
      type: "job_status",
      title,
      content,
      data: {
        applicationId: application.id,
        jobId: job.id,
        status,
        type: "application_status",
      },
    });
  }

  static async notifyWorkerForMessage(message: any, job: any, sender: any) {
    return await this.createNotification({
      userId: job.worker_id,
      type: "message",
      title: "Nouveau message",
      content: `${sender.full_name} vous a envoyé un message concernant "${job.title}"`,
      data: {
        messageId: message.id,
        jobId: job.id,
        senderId: sender.id,
        type: "new_message",
      },
    });
  }
}
