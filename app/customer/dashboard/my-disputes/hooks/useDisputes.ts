// hooks/useDisputes.ts
import { useState, useEffect, useCallback } from "react";
import { Dispute, UpdateDisputeData } from "../types/dispute";
import { supabase } from "@/lib/supabase";

interface DisputeWithRelations extends Dispute {
  jobs?: { id: string; title: string; description?: string };
  created_by_user?: { id: string; email: string; full_name?: string };
  against_user_user?: { id: string; email: string; full_name?: string };
  resolved_by_user?: { id: string; email: string; full_name?: string };
}

export const useDisputes = () => {
  const [disputes, setDisputes] = useState<DisputeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer d'abord les disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });

      if (disputesError) throw disputesError;

      if (!disputesData || disputesData.length === 0) {
        setDisputes([]);
        return;
      }

      // Récupérer les informations des jobs
      const jobIds = disputesData.map((d) => d.job_id).filter(Boolean);
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, title, description")
        .in("id", jobIds);

      // Récupérer les informations des utilisateurs
      const userIds = [
        ...disputesData.map((d) => d.created_by),
        ...disputesData.map((d) => d.against_user),
        ...disputesData.map((d) => d.resolved_by).filter(Boolean),
      ];

      const { data: usersData } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      // Mapper les données
      const disputesWithRelations = disputesData.map((dispute) => ({
        ...dispute,
        job: jobsData?.find((job) => job.id === dispute.job_id),
        created_by_user: usersData?.find(
          (user) => user.id === dispute.created_by
        ),
        against_user_user: usersData?.find(
          (user) => user.id === dispute.against_user
        ),
        resolved_by_user: usersData?.find(
          (user) => user.id === dispute.resolved_by
        ),
      }));

      setDisputes(disputesWithRelations);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return {
    disputes,
    loading,
    error,
    fetchDisputes,
  };
};
