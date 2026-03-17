import { Briefcase, Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-purple-600 mx-auto mb-4"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-purple-600 animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Loading applications
        </h3>
        <p className="text-sm text-gray-500">
          Please wait while we fetch your applications...
        </p>
      </div>
    </div>
  );
}
