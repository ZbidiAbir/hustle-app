import Link from "next/link";
import {
  ChevronLeft,
  Phone,
  Video,
  Info,
  MoreVertical,
  Briefcase,
  DollarSign,
} from "lucide-react";
import { CustomerAvatar } from "./CustomerAvatar";
import { Customer, Job } from "@/types/chat";

interface ChatHeaderProps {
  customer: Customer | null;
  job: Job | null;
  customerId: string;
  onInfoClick?: () => void;
}

export function ChatHeader({
  customer,
  job,
  customerId,
  onInfoClick,
}: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/worker/dashboard/jobs"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>

            <CustomerAvatar
              customer={customer}
              customerId={customerId}
              size="md"
            />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-gray-900">
                  {customer?.full_name || customer?.company_name || "Customer"}
                </h1>
                {customer?.rating && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 rounded">
                    <span className="text-xs font-medium text-yellow-700">
                      ★
                    </span>
                    <span className="text-xs text-yellow-700">
                      {customer.rating}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Briefcase className="w-3 h-3" />
                <span className="truncate max-w-37.5">{job?.title}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <DollarSign className="w-3 h-3" />
                <span>${job?.price}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onInfoClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
