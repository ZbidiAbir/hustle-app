import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface JobHeaderProps {
  category: string;
}

export function JobHeader({ category }: JobHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/worker/dashboard/jobs"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Job Details</h1>
            <p className="text-sm text-gray-500">{category}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
