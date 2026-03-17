import Link from "next/link";
import { Mail, Award, Star, MessageSquare, BadgeCheck } from "lucide-react";
import {
  getAvatarColor,
  getCustomerAvatar,
  getCustomerDisplayName,
  getCustomerIcon,
} from "@/utils/jobDetail.utils";
import { Customer } from "@/types/jobDetail";

interface CustomerCardProps {
  customer: Customer;
  customerId: string;
  jobId: string;
  applicationStatus?: React.ReactNode;
  applicationForm?: React.ReactNode;
  chatButton?: React.ReactNode;
}

export function CustomerCard({
  customer,
  customerId,
  jobId,
  applicationStatus,
  applicationForm,
  chatButton,
}: CustomerCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
      <div className="p-6 border-b bg-linear-to-r from-purple-600 to-purple-700">
        <h3 className="text-lg font-semibold text-white">Client</h3>
      </div>

      <div className="p-6">
        {/* Customer Profile */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            {getCustomerAvatar(customer) || (
              <div
                className={`w-16 h-16 rounded-full bg-linear-to-r ${getAvatarColor(
                  customerId
                )} flex items-center justify-center text-white font-bold text-2xl shadow-md`}
              >
                {getCustomerDisplayName(customer).charAt(0).toUpperCase()}
              </div>
            )}
            {customer.business_verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-white">
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              {getCustomerIcon(customer)}
              <h4 className="font-semibold text-gray-900">
                {getCustomerDisplayName(customer)}
              </h4>
            </div>
            {customer.account_type === "smallbusiness" && (
              <p className="text-xs text-blue-600">Business Account</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{customer.rating}</span>
              <span className="text-sm text-gray-500">
                ({customer.jobs_posted} jobs)
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{customer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Award className="w-4 h-4 text-gray-400" />
            <span>Member since {customer.member_since}</span>
          </div>
        </div>

        {/* Application Status */}
        {applicationStatus}

        {/* Apply Form or Chat Button */}
        {applicationForm || chatButton}
      </div>
    </div>
  );
}
