import { supabase } from "@/lib/supabase";
import { MessageType } from "../enums/chat.enum";

 export async function sendMessage(conversationId : string , senderId: string, message: {
    content : string | null,
    type : MessageType.TEXT | MessageType.AUDIO | MessageType.IMAGE | MessageType.FILE | MessageType.LINK,
 }) {
    const { error } = await supabase.from("messages").insert([
      {
        conversation_id : conversationId,
        sender_id: senderId,
        content: message.content,
        type: message.type,
      },
    ]);

    if (error) throw error;
  },
