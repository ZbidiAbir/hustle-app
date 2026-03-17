import { Customer } from "@/types/chat";
import { getAvatarColor, getCustomerAvatar } from "@/utils/chat.utils";

interface CustomerAvatarProps {
  customer: Customer | null;
  customerId: string;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}

export function CustomerAvatar({
  customer,
  customerId,
  size = "md",
  showStatus = true,
}: CustomerAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-lg",
    lg: "w-12 h-12 text-xl",
  };

  const avatarContent = getCustomerAvatar(customer);

  return (
    <div className="relative">
      {avatarContent ? (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden`}>
          {avatarContent}
        </div>
      ) : (
        <div
          className={`${
            sizeClasses[size]
          } rounded-full bg-linear-to-r ${getAvatarColor(
            customerId
          )} flex items-center justify-center text-white font-bold shadow-sm`}
        >
          {customer?.full_name?.charAt(0).toUpperCase() ||
            customer?.company_name?.charAt(0).toUpperCase() ||
            "C"}
        </div>
      )}
      {showStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
}
