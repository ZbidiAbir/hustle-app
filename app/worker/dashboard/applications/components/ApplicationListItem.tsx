import Link from "next/link";
import {
  MapPin,
  DollarSign,
  Clock,
  ChevronRight,
  Building2,
} from "lucide-react";
import { Application } from "@/types/application.types";
import {
  formatRelativeTime,
  getAvatarColor,
  getStatusConfig,
} from "@/utils/application.utils";

interface ApplicationListItemProps {
  app: Application;
}

export function ApplicationListItem({ app }: ApplicationListItemProps) {
  const statusConfig = getStatusConfig(app.status);
  const StatusIcon = statusConfig.icon;
  const isBusiness = app.customer?.account_type === "smallbusiness";

  return (
    <Link
      href={`/worker/dashboard/job/${app.job_id}`}
      className="block bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all group"
    >
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          <div className={`p-3 rounded-xl ${statusConfig.bg}`}>
            <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {app.job.title}
              </h3>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${statusConfig.bg} ${statusConfig.textColor}`}
              >
                {statusConfig.text}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{app.job.location}</span>
              </div>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>${app.job.price}</span>
              </div>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeTime(app.created_at)}</span>
              </div>
            </div>

            {app.customer && (
              <div className="flex items-center gap-2 mt-2">
                <div
                  className={`w-5 h-5 rounded-full bg-linear-to-r ${getAvatarColor(
                    app.job.customer_id
                  )} flex items-center justify-center text-white text-xs overflow-hidden`}
                >
                  {isBusiness && app.customer.company_logo_url ? (
                    <img
                      src={app.customer.company_logo_url}
                      alt={app.customer.company_name || ""}
                      className="object-cover w-full h-full"
                    />
                  ) : app.customer.avatar_url ? (
                    <img
                      src={app.customer.avatar_url}
                      //@ts-ignore
                      alt={app.customer.full_name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    app.customer.full_name?.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs text-gray-600">
                  {isBusiness && app.customer.company_name
                    ? app.customer.company_name
                    : app.customer.full_name}
                </span>
                {isBusiness && (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <Building2 className="w-3 h-3 text-gray-400" />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Price and Action */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-gray-900">${app.job.price}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
          </div>
        </div>
      </div>
    </Link>
  );
}
