import { Conversation } from "@/types/messages.types";
import { messageUtils } from "@/utils/messages.utils";
import { Briefcase, MapPin, Calendar } from "lucide-react";

interface JobInfoBarProps {
  conversation: Conversation;
}

export const JobInfoBar: React.FC<JobInfoBarProps> = ({ conversation }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 text-sm overflow-x-auto">
      <div className="flex items-center gap-1 text-gray-600 whitespace-nowrap">
        <Briefcase className="w-4 h-4" />
        <span className="font-medium">${conversation.price}</span>
      </div>

      <div className="flex items-center gap-1 text-gray-600 whitespace-nowrap">
        <MapPin className="w-4 h-4" />
        <span>{conversation.location}</span>
      </div>

      {conversation.date && (
        <div className="flex items-center gap-1 text-gray-600 whitespace-nowrap">
          <Calendar className="w-4 h-4" />
          <span>{new Date(conversation.date).toLocaleDateString()}</span>
        </div>
      )}

      <span
        className={`ml-auto text-xs px-2 py-1 rounded-full whitespace-nowrap ${messageUtils.getStatusClass(
          conversation.status
        )}`}
      >
        {conversation.status.replace("_", " ")}
      </span>
    </div>
  );
};
