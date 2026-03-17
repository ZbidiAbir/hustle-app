import { ChevronLeft, Phone, Video, Info } from "lucide-react";
import { Avatar } from "./Avatar";
import { Conversation } from "@/types/messages.types";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onBack,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <img
          //@ts-ignore
          src={conversation.otherUser.avatar_url}
          alt=""
          className="w-16 h-16 rounded-full"
        />

        <div>
          <h2 className="font-semibold text-gray-900">
            {conversation.otherUser.full_name}
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="capitalize">{conversation.otherUser.role}</span>
            <span>{conversation.otherUser.phone}</span>
            <span>•</span>
            <span className="truncate max-w-[150px]">
              {conversation.jobTitle}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Phone className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Video className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Info className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};
