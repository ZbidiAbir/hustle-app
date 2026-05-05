import { supabase } from "@/lib/supabase";
import { Message } from "@/modules/chat/types/chat.types";

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}
