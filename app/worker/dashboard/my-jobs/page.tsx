import { Suspense } from "react";
import { Briefcase } from "lucide-react";
import WorkerMyJobsContent from "./components/WorkerMyJobsContent";

export default function WorkerMyJobsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WorkerMyJobsContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="text-gray-600 font-medium">Loading your jobs...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}
