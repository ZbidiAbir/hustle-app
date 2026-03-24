import { MessageCircle } from "lucide-react";
import { useIconsAndBadges } from "../../../hooks/useIconsAndBadges";

export function ApplicationStatusBanner({
  status,
  onContact,
}: {
  status: string;
  onContact: () => void;
}) {
  const { getStatusConfig } = useIconsAndBadges();
  const config = getStatusConfig(status);

  if (status === "pending") return null;

  return (
    <div
      className={`mb-6 p-4 rounded-xl ${config.bgColor} border flex items-center justify-between`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg">
          <config.icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div>
          <h3 className={`font-semibold ${config.color}`}>
            Application {config.label}
          </h3>
          <p className="text-sm text-gray-600">
            {status === "accepted"
              ? "This worker has been assigned to the job"
              : "This application was not selected"}
          </p>
        </div>
      </div>
      {status === "accepted" && (
        <button
          onClick={onContact}
          className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          Contact Worker
        </button>
      )}
    </div>
  );
}
