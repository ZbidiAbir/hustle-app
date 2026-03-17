import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface ChatButtonProps {
  jobId: string;
}

export function ChatButton({ jobId }: ChatButtonProps) {
  return (
    <div className="flex gap-2">
      <Link
        href={`/worker/dashboard/chat/${jobId}`}
        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
      >
        <MessageSquare className="w-5 h-5" />
        Chat with Client
      </Link>
    </div>
  );
}
