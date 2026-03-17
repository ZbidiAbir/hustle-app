import { supabase } from "@/lib/supabase";
import { EmploymentType, WorkExperience } from "@/types/profile";

export class WorkExperienceService {
  // Récupérer toutes les expériences d'un worker
  static async getWorkerExperiences(
    workerId: string
  ): Promise<WorkExperience[]> {
    const { data, error } = await supabase
      .from("work_experience")
      .select("*")
      .eq("worker_id", workerId)
      .order("start_date", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Créer une nouvelle expérience
  static async createExperience(
    workerId: string,
    data: {
      company_name: string;
      location: string;
      position: string;
      employment_type: EmploymentType;
      start_date: string;
      end_date: string | null;
      current: boolean;
      description: string;
    }
  ) {
    const { error } = await supabase.from("work_experience").insert([
      {
        worker_id: workerId,
        ...data,
        end_date: data.current ? null : data.end_date,
      },
    ]);

    if (error) throw error;
  }

  // Mettre à jour une expérience
  static async updateExperience(
    experienceId: string,
    data: {
      company_name: string;
      location: string;
      position: string;
      employment_type: EmploymentType;
      start_date: string;
      end_date: string | null;
      current: boolean;
      description: string;
    }
  ) {
    const { error } = await supabase
      .from("work_experience")
      .update({
        ...data,
        end_date: data.current ? null : data.end_date,
      })
      .eq("id", experienceId);

    if (error) throw error;
  }

  // Supprimer une expérience
  static async deleteExperience(experienceId: string) {
    const { error } = await supabase
      .from("work_experience")
      .delete()
      .eq("id", experienceId);

    if (error) throw error;
  }
}
