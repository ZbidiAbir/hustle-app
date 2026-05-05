import { Conversation, Customer } from "@/modules/chat/types/chat.types";
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
  Clock,
  TrendingUp,
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

// Fonction pour formater le prix selon le type
const formatJobPrice = (conversation: Conversation) => {
  const { pay_type, fixed_rate, min_rate, max_rate, hourly_rate, price } =
    conversation;

  // Si pas de pay_type, utiliser l'ancien champ price
  if (!pay_type) {
    return price ? `$${price}` : null;
  }

  const type = String(pay_type).toLowerCase().trim();

  switch (type) {
    case "fixed":
      if (fixed_rate) {
        return `$${fixed_rate}`;
      }
      return price ? `$${price}` : null;

    case "range":
      if (min_rate && max_rate) {
        return `$${min_rate} - $${max_rate}`;
      }
      if (min_rate) {
        return `From $${min_rate}`;
      }
      if (max_rate) {
        return `Up to $${max_rate}`;
      }
      return price ? `$${price}` : null;

    case "hourly":
      if (hourly_rate) {
        return `$${hourly_rate}/hr`;
      }
      return price ? `$${price}/hr` : null;

    default:
      return price ? `$${price}` : null;
  }
};

// Fonction pour obtenir l'icône et le label du type de prix
const getPriceTypeInfo = (conversation: Conversation) => {
  if (!conversation.pay_type) {
    return {
      icon: DollarSign,
      label: "Price",
      color: "text-gray-500",
      bg: "bg-gray-50",
    };
  }

  const type = String(conversation.pay_type).toLowerCase().trim();

  switch (type) {
    case "fixed":
      return {
        icon: DollarSign,
        label: "Fixed price",
        color: "text-green-600",
        bg: "bg-green-50",
      };
    case "range":
      return {
        icon: TrendingUp,
        label: "Price range",
        color: "text-blue-600",
        bg: "bg-blue-50",
      };
    case "hourly":
      return {
        icon: Clock,
        label: "Hourly rate",
        color: "text-purple-600",
        bg: "bg-purple-50",
      };
    default:
      return {
        icon: DollarSign,
        label: "Price",
        color: "text-gray-500",
        bg: "bg-gray-50",
      };
  }
};

export function ChatHeader({
  conversation,
  customer,
  onBack,
  onInfoClick,
}: ChatHeaderProps) {
  const customerDisplayName = getCustomerDisplayName(customer);
  const customerAvatar = getCustomerAvatar(customer);
  const isBusiness = customer.account_type === "smallbusiness";

  const priceDisplay = formatJobPrice(conversation);
  const priceTypeInfo = getPriceTypeInfo(conversation);
  const PriceIcon = priceTypeInfo.icon;

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
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-gray-900">
              {customer.company_name || customer.full_name}
            </h2>
            {customer.full_name && customer.company_name && (
              <p className="text-xs text-gray-500">
                Hiring Team ({customer.full_name})
              </p>
            )}
            {isBusiness && <Building2 className="w-4 h-4 text-gray-400" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <Briefcase className="w-3 h-3 shrink-0" />
            <span className="">{conversation.jobTitle}</span>

            {conversation.category && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="rounded-full px-2 py-0.5 bg-gray-100 text-gray-600 text-xs">
                  {conversation.category}
                </span>
              </>
            )}

            {priceDisplay && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${priceTypeInfo.bg}`}
                >
                  <PriceIcon className={`w-3 h-3 ${priceTypeInfo.color}`} />
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
