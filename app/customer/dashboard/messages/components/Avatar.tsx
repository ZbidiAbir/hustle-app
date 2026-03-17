import { messageUtils } from "@/utils/messages.utils";

interface AvatarProps {
  userId: string;
  name: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  badgeCount?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
  userId,
  name,
  size = "md",
  showBadge = false,
  badgeCount = 0,
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-lg",
  };

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${
          sizeClasses[size]
        } rounded-full bg-gradient-to-br ${messageUtils.getAvatarColor(
          userId
        )} flex items-center justify-center text-white font-bold`}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      {showBadge && badgeCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-purple-600 rounded-full border-2 border-white flex items-center justify-center px-1">
          <span className="text-xs text-white font-medium">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        </div>
      )}
    </div>
  );
};
