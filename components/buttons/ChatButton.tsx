"use client";
import { getCurrentUser } from "@/lib/common/currentUser";
import { createConversation } from "@/modules/chat/actions/createConversation";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
const ChatButton = ({
  jobId,
  participants,
}: {
  jobId: string;
  participants: string[];
}) => {
  const router = useRouter();

  console.log(jobId);

  async function handleChatClick() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      toast.error("Vous devez être connecté pour accéder au chat");
      return;
    }
    const participantsWithCurrentUser = [...participants, currentUser.id];
    console.log(participantsWithCurrentUser);
    console.log(currentUser.id);
    const conversation = await createConversation({
      jobId,
      participants: participantsWithCurrentUser,
    });

    console.log(conversation);
    router.push(`/worker/dashboard/chat/${conversation.id}`);
  }
  return (
    <button
      onClick={handleChatClick}
      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1.5"
    >
      <MessageSquare className="w-4 h-4" />
      Chat
    </button>
  );
};

export default ChatButton;
