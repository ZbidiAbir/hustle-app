import { MessageSquare } from "lucide-react";

export function EmptyChat() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-10 h-10 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your Messages
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Select a conversation from the list to start chatting
        </p>
      </div>
    </div>
  );
}
