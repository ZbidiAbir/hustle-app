import { Customer } from "@/modules/chat/types/chat.types";
import { MessageSquare } from "lucide-react";

export function EmptyChat({ customer }: { customer?: Customer | null }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-10 h-10 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {customer ? `No messages yet` : "Your Messages"}
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          {customer
            ? `Start the conversation with ${customer?.full_name || customer?.company_name || "the customer"}`
            : "Select a conversation from the list to start chatting"}
        </p>
      </div>
    </div>
  );
}
