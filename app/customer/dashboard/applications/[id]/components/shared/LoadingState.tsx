export function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Loading Application
        </h3>
        <p className="text-gray-500">
          Please wait while we fetch the details...
        </p>
      </div>
    </div>
  );
}
