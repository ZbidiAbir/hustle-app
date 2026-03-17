import { MessageSquare } from "lucide-react";
import Link from "next/link";

export function EmptyConversations() {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <MessageSquare className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No conversations yet
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        When you're assigned to jobs or start chatting with customers, they'll
        appear here
      </p>
      <Link
        href="/worker/jobs"
        className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition"
      >
        Browse Jobs
      </Link>
    </div>
  );
}
