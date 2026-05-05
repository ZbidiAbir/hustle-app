import { Message } from "@/modules/chat/types/chat.types";

interface MessageWrapperProps {
  message: Message;
  isMine: boolean;
  showAvatar: boolean;
  senderName: string | null;
  senderAvatar: React.ReactNode | null;
  children: React.ReactNode;
}

const MessageWrapper = ({
  message,
  isMine,
  showAvatar,
  senderName,
  senderAvatar,
  children,
}: MessageWrapperProps) => {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[70%] ${
          isMine ? "flex-row-reverse" : "flex-row"
        } items-end gap-2`}
      >
        {/* Avatar for other user */}
        {!isMine && showAvatar && (
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
            {senderAvatar || (
              <div className="w-full h-full bg-linear-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                {senderName?.charAt(0).toUpperCase() || "C"}
              </div>
            )}
          </div>
        )}
        {!isMine && !showAvatar && <div className="w-8 h-8 shrink-0" />}

        {/* Message Content */}
        {children}

        {/* My Avatar */}
        {isMine && (
          <div className="w-8 h-8 rounded-full bg-linear-to-r from-green-500 to-purple-500 shrink-0 flex items-center justify-center text-white text-xs font-medium">
            {message.sender_name?.charAt(0).toUpperCase() || "M"}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageWrapper;
