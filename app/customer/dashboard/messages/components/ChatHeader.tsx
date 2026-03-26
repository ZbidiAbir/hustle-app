import { ChevronLeft, Phone, Video, Info } from "lucide-react";
import { Conversation } from "@/types/messages.types";
import { useState } from "react";
import { WorkerDetailsModal } from "./WorkerDetailsModal";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onBack,
}) => {
  const [showWorkerDetails, setShowWorkerDetails] = useState(false);

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={() => setShowWorkerDetails(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {conversation.otherUser?.avatar_url ? (
              <img
                src={conversation.otherUser.avatar_url}
                alt={conversation.otherUser.full_name || "User"}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {conversation.otherUser?.full_name?.charAt(0).toUpperCase() ||
                  "?"}
              </div>
            )}

            <div className="text-left">
              <h2 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {conversation.otherUser?.full_name || "Unknown User"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="capitalize">
                  {conversation.otherUser?.role || "Worker"}
                </span>
                <span>•</span>
                <span>{conversation.jobTitle}</span>
                {conversation.category && (
                  <>
                    <span>•</span>
                    <span className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                      {conversation.category}
                    </span>
                  </>
                )}
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={() => setShowWorkerDetails(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <Info className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Afficher le modal seulement si showWorkerDetails est true */}
      {showWorkerDetails && (
        <WorkerDetailsModal
          worker={conversation.otherUser}
          job={conversation}
          onClose={() => setShowWorkerDetails(false)}
        />
      )}
    </>
  );
};
