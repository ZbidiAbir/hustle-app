// services/worker.service.ts
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/profile";

export const workerService = {
  async getWorkerDetails(workerId: string): Promise<{
    profile: Profile;
    stats: {
      jobs_completed: number;
      rating: number;
      reviews_count: number;
      response_rate: number;
      member_since: string;
    };
    recent_reviews: any[];
    work_experience: any[];
  }> {
    // 1. Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", workerId)
      .single();

    if (profileError) throw profileError;

    // 2. Compter les jobs complétés
    const { count: jobsCompleted, error: jobsError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("worker_id", workerId)
      .eq("status", "completed");

    if (jobsError) throw jobsError;

    // 3. Récupérer les reviews (rates)
    const { data: reviews, error: reviewsError } = await supabase
      .from("rates")
      .select("*")
      .eq("reviewee_id", workerId)
      .order("created_at", { ascending: false });

    if (reviewsError) throw reviewsError;

    // Calculer la moyenne des ratings
    const avgRating =
      reviews && reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : profile?.rating || 0;

    // 4. Récupérer l'expérience professionnelle
    const { data: workExperience, error: workError } = await supabase
      .from("work_experience")
      .select("*")
      .eq("worker_id", workerId)
      .order("start_date", { ascending: false });

    if (workError) throw workError;

    // 5. Calculer le taux de réponse (si vous avez un système de messages)
    // Pour l'instant, on met une valeur par défaut
    const responseRate = 95; // À implémenter selon votre logique

    return {
      profile,
      stats: {
        jobs_completed: jobsCompleted || 0,
        rating: avgRating,
        reviews_count: reviews?.length || 0,
        response_rate: responseRate,
        member_since: profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })
          : "N/A",
      },
      recent_reviews: reviews?.slice(0, 3) || [],
      work_experience: workExperience || [],
    };
  },
};
