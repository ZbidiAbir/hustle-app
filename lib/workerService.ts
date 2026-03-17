import { supabase } from "@/lib/supabase";
import {
  WorkerDetails,
  WorkerReview,
  WorkerPortfolio,
  WorkerCertification,
} from "@/types/worker";

export const workerService = {
  // Récupérer les détails complets d'un worker
  async getWorkerDetails(workerId: string): Promise<WorkerDetails | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id, 
          full_name, 
          email, 
          avatar_url, 
          phone,
          bio,
          role,
          
          -- Informations professionnelles
          profession,
          skills,
          experience_years,
          hourly_rate,
          completed_jobs,
          rating,
          review_count,
          
          -- Disponibilité
          availability,
          available_days,
          
          -- Localisation
          location,
          service_area,
          
          -- Vérifications
          verified,
          verified_at,
          id_verified,
          background_check,
          
          -- Statistiques
          response_rate,
          response_time,
          
          -- Réseaux sociaux
          website,
          social_links,
          
          created_at,
          updated_at
        `
        )
        .eq("id", workerId)
        .eq("role", "worker")
        .single();

      if (error) throw error;
      //@ts-ignore
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération du worker:", error);
      return null;
    }
  },

  // Récupérer les avis du worker
  async getWorkerReviews(
    workerId: string,
    limit = 10
  ): Promise<WorkerReview[]> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          customer:customer_id (
            full_name,
            avatar_url
          ),
          job:job_id (
            title
          )
        `
        )
        .eq("worker_id", workerId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map((review) => ({
        id: review.id,
        worker_id: review.worker_id,
        customer_id: review.customer_id,
        customer_name: review.customer.full_name,
        customer_avatar: review.customer.avatar_url,
        job_id: review.job_id,
        job_title: review.job.title,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        customer_response: review.customer_response,
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des avis:", error);
      return [];
    }
  },

  // Récupérer le portfolio du worker
  async getWorkerPortfolio(workerId: string): Promise<WorkerPortfolio[]> {
    try {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("worker_id", workerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erreur lors de la récupération du portfolio:", error);
      return [];
    }
  },

  // Récupérer les certifications du worker
  async getWorkerCertifications(
    workerId: string
  ): Promise<WorkerCertification[]> {
    try {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("worker_id", workerId)
        .order("issued_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des certifications:",
        error
      );
      return [];
    }
  },

  // Vérifier si un worker est disponible pour une date
  async checkAvailability(workerId: string, date: string): Promise<boolean> {
    try {
      // Vérifier si le worker a déjà un job à cette date
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("id")
        .eq("worker_id", workerId)
        .eq("date", date)
        .in("status", ["assigned", "in_progress"]);

      if (error) throw error;

      // Si aucun job trouvé, le worker est disponible
      return jobs.length === 0;
    } catch (error) {
      console.error("Erreur lors de la vérification de disponibilité:", error);
      return false;
    }
  },

  // Obtenir les statistiques du worker
  async getWorkerStats(workerId: string) {
    try {
      const { data, error } = await supabase.rpc("get_worker_stats", {
        worker_id_param: workerId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return null;
    }
  },
};
