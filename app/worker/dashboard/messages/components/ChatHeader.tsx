import { Conversation, Customer } from "@/types/chat";
import {
  ChevronLeft,
  Phone,
  Video,
  Info,
  MoreVertical,
  Star,
  Building2,
  BadgeCheck,
  Briefcase,
  DollarSign,
} from "lucide-react";
import {
  getAvatarColor,
  getCustomerDisplayName,
  getCustomerAvatar,
} from "@/utils/chat.utils";

interface ChatHeaderProps {
  conversation: Conversation;
  customer: Customer;
  onBack: () => void;
  onInfoClick?: () => void;
}

export function ChatHeader({
  conversation,
  customer,
  onBack,
  onInfoClick,
}: ChatHeaderProps) {
  const customerDisplayName = getCustomerDisplayName(customer);
  const customerAvatar = getCustomerAvatar(customer);
  const isBusiness = customer.account_type === "smallbusiness";

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Back button for mobile */}
        <button
          onClick={onBack}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Avatar with company logo if available */}
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ${
              customerAvatar
                ? ""
                : `bg-linear-to-r ${getAvatarColor(customer.id)}`
            }`}
          >
            {customerAvatar ? (
              customerAvatar
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {customerDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {isBusiness && customer.business_verified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white">
              <BadgeCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">
              {customerDisplayName}
            </h2>
            {isBusiness && <Building2 className="w-4 h-4 text-gray-400" />}
            {customer.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">{customer.rating}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Briefcase className="w-3 h-3" />
            <span className="truncate max-w-37.5">{conversation.jobTitle}</span>
            <span>•</span>
            <DollarSign className="w-3 h-3" />
            <span>${conversation.price}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
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
  );
}
