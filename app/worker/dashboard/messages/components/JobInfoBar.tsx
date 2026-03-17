import { Conversation } from "@/types/chat";
import {
  MapPin,
  Briefcase,
  Clock,
  Award,
  AlertCircle,
  Package,
  Zap,
} from "lucide-react";
import {
  getJobStatusColor,
  getJobStatusText,
  getUrgencyColor,
} from "@/utils/chat.utils";

interface JobInfoBarProps {
  conversation: Conversation;
}

export function JobInfoBar({ conversation }: JobInfoBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center flex-wrap gap-3 text-sm">
        {/* Status badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getJobStatusColor(
            conversation.status
          )}`}
        >
          {getJobStatusText(conversation.status)}
        </span>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{conversation.location}</span>
        </div>

        {/* Urgency if available */}
        {conversation.jobDetails?.urgency && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getUrgencyColor(
              conversation.jobDetails.urgency
            )}`}
          >
            <Zap className="w-3 h-3" />
            <span className="capitalize">
              {conversation.jobDetails.urgency}
            </span>
          </div>
        )}

        {/* Level required if available */}
        {conversation.jobDetails?.level_required && (
          <div className="flex items-center gap-1 text-gray-600">
            <Award className="w-4 h-4" />
            <span className="capitalize">
              {conversation.jobDetails.level_required}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
