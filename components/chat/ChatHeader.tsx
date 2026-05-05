import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Info, Briefcase } from "lucide-react";
import { CustomerAvatar } from "./CustomerAvatar";
import { Customer, Job } from "@/modules/chat/types/chat.types";
import { formatJobPrice, getPriceTypeInfo } from "@/modules/chat/utils/jobs";
import CustomerDetailsModal from "./CustomerDetailsModal";
import { chatService } from "@/lib/chat.service";

interface ChatHeaderProps {
  job: Job | null;
  onInfoClick?: () => void;
  customer: Customer | null;
}

export function ChatHeader({ job, customer, onInfoClick }: ChatHeaderProps) {
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const priceDisplay = formatJobPrice(job);
  const priceTypeInfo = getPriceTypeInfo(job);
  const PriceIcon = priceTypeInfo.icon;

  const handleInfoClick = () => {
    setShowCustomerDetails(true);
    if (onInfoClick) onInfoClick();
  };

  if (!customer) {
    return <h1>Customer not found</h1>;
  }

  return (
    <>
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
                customerId={customer.id}
                size="md"
              />

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-gray-900">
                    {customer?.full_name ||
                      customer?.company_name ||
                      "Customer"}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                  <Briefcase className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-50">{job?.title}</span>

                  {job?.category && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="rounded-full px-2 py-0.5 bg-gray-100 text-gray-600 text-xs">
                        {job.category}
                      </span>
                    </>
                  )}

                  {priceDisplay && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          priceTypeInfo.bg || "bg-gray-50"
                        }`}
                      >
                        <PriceIcon
                          className={`w-3 h-3 ${priceTypeInfo.color}`}
                        />
                        <span
                          className={`text-xs font-medium ${priceTypeInfo.color}`}
                        >
                          {priceDisplay}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleInfoClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="View customer details"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showCustomerDetails && (
        <CustomerDetailsModal
          customer={customer}
          job={job}
          onClose={() => setShowCustomerDetails(false)}
        />
      )}
    </>
  );
}
