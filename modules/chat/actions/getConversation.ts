import { supabase } from "@/lib/supabase";

export const getConversation = async (conversationId: string) => {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      *,
      jobs (*)
    `,
    )
    .eq("id", conversationId)
    .single();

  if (error) throw error;
  return data;
};

// export const getConversation = async (conversationId: string) => {
//   const { data, error } = await supabase
//     .from("conversations")
//     .select("*")
//     .eq("id", conversationId)
//     .single();

//   if (error) throw error;
//   return data;
// };
