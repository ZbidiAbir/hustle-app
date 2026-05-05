import Link from "next/link";
import { AlertCircle, ChevronLeft } from "lucide-react";

interface ErrorStateProps {
  error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          href="/worker/dashboard/jobs"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </div>
    </div>
  );
}
