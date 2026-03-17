import { Customer } from "@/types/chat";
import { MessageCircle } from "lucide-react";

interface EmptyChatProps {
  customer: Customer | null;
}

export function EmptyChat({ customer }: EmptyChatProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-10 h-10 text-purple-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No messages yet
        </h3>
        <p className="text-gray-500">
          Start the conversation with{" "}
          {customer?.full_name || customer?.company_name || "the customer"}
        </p>
      </div>
    </div>
  );
}
