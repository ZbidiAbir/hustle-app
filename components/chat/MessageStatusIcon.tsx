import { Check, CheckCheck } from "lucide-react";
import { MessageStatus } from "../../app/worker/dashboard/messages/types/message";

export const MessageStatusIcon = ({ status }: { status?: MessageStatus }) => {
  if (!status || status === "sending") {
    return <Check size={12} className="text-blue-300" />;
  }
  if (status === "sent") {
    return <Check size={12} className="text-blue-200" />;
  }
  if (status === "delivered") {
    return <CheckCheck size={12} className="text-blue-200" />;
  }
  if (status === "read") {
    return <CheckCheck size={12} className="text-white" />;
  }
  return null;
};
