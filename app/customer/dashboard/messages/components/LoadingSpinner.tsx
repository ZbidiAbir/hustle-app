export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200"></div>
        <div className="absolute top-0 left-0 animate-spin rounded-full h-12 w-12 border-2 border-t-purple-600"></div>
      </div>
    </div>
  );
};
