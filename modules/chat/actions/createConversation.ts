import { supabase } from "@/lib/supabase";

export const createConversation = async ({
  jobId,
  participants,
}: {
  jobId: string | null;
  participants: string[];
}) => {
  const { data: conversationId, error } = await supabase.rpc(
    "find_or_create_conversation",
    {
      p_job_id: jobId,
      p_user_ids: participants,
    },
  );

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("conversations")
    .select()
    .eq("id", conversationId)
    .single();

  if (fetchError) throw fetchError;

  return data;
};
