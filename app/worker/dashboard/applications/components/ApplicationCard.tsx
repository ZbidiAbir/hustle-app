import Link from "next/link";
import {
  Clock,
  MapPin,
  MessageSquare,
  ChevronRight,
  Trash2,
  CheckCircle,
  Copy,
  Check,
  Phone,
  Building2,
  BadgeCheck,
  ChevronDown,
} from "lucide-react";
import { CompanyDetails } from "./CompanyDetails";
import { Application } from "@/types/application.types";
import {
  formatRelativeTime,
  getAvatarColor,
  getJobStatusConfig,
  getStatusConfig,
  getUrgencyColor,
} from "@/utils/application.utils";

interface ApplicationCardProps {
  app: Application;
  isSelected: boolean;
  isCopied: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onWithdraw: () => void;
  onCopyEmail: () => void;
  onToggleExpand: () => void;
}

export function ApplicationCard({
  app,
  isSelected,
  isCopied,
  isExpanded,
  onSelect,
  onWithdraw,
  onCopyEmail,
  onToggleExpand,
}: ApplicationCardProps) {
  const statusConfig = getStatusConfig(app.status);
  const StatusIcon = statusConfig.icon;
  const jobStatusConfig = getJobStatusConfig(app.job.status);
  const JobStatusIcon = jobStatusConfig.icon;
  const isBusiness = app.customer?.account_type === "smallbusiness";

  return (
    <div
      className={`bg-white rounded-xl border ${
        isSelected
          ? "border-purple-400 ring-2 ring-purple-200"
          : "border-gray-200"
      } hover:shadow-lg transition-all overflow-hidden group`}
    >
      {/* Status Bar */}
      <div className={`h-1.5 ${statusConfig.bg}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}
            >
              <StatusIcon className={`w-3 h-3 ${statusConfig.iconColor}`} />
              <span className={`text-xs font-medium ${statusConfig.textColor}`}>
                {statusConfig.text}
              </span>
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(app.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {app.status === "pending" && (
              <button
                onClick={onWithdraw}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                title="Withdraw application"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onSelect}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition opacity-0 group-hover:opacity-100"
            >
              <CheckCircle
                className={`w-4 h-4 ${
                  isSelected ? "text-purple-600" : "text-gray-300"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Job Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <Link
            href={`/worker/dashboard/job/${app.job_id}`}
            className="hover:underline flex-1"
          >
            <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {app.job.title}
            </h2>
          </Link>
          <div className="text-right ml-3">
            <p className="text-xl font-bold text-gray-900">${app.job.price}</p>
            <p className="text-xs text-gray-500">Fixed price</p>
          </div>
        </div>

        {/* Job Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
            {app.job.category}
          </span>
          {app.job.urgency && (
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${getUrgencyColor(
                app.job.urgency
              )}`}
            >
              {app.job.urgency}
            </span>
          )}
          {app.job.level_required && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              {app.job.level_required}
            </span>
          )}
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${jobStatusConfig.color}`}
          >
            <JobStatusIcon className="w-3 h-3 inline mr-1" />
            {jobStatusConfig.text}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{app.job.location}</span>
        </div>

        {/* Customer Info */}
        {app.customer && (
          <div className="mb-3">
            <div
              className={`p-3 ${
                isBusiness
                  ? "bg-linear-to-r from-gray-50 to-gray-100 cursor-pointer hover:from-gray-100 hover:to-gray-200"
                  : "bg-linear-to-r from-gray-50 to-gray-100"
              } rounded-xl transition`}
              onClick={isBusiness ? onToggleExpand : undefined}
            >
              <div className="flex items-center gap-3">
                {/* Customer Avatar */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full bg-linear-to-r ${getAvatarColor(
                      app.job.customer_id
                    )} flex items-center justify-center text-white text-sm font-medium shadow-md overflow-hidden`}
                  >
                    {isBusiness && app.customer.company_logo_url ? (
                      <img
                        src={app.customer.company_logo_url}
                        alt={app.customer.company_name || "Company"}
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
                      app.customer.full_name?.charAt(0).toUpperCase() || "C"
                    )}
                  </div>
                  {isBusiness && app.customer.business_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                      <BadgeCheck className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {isBusiness && app.customer.company_name
                        ? app.customer.company_name
                        : app.customer.full_name}
                    </p>
                    {isBusiness && (
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate">
                      {isBusiness && app.customer.company_email
                        ? app.customer.company_email
                        : app.customer.email}
                    </span>
                    {(app.customer.phone || app.customer.company_phone) && (
                      <>
                        <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0" />
                        <a
                          href={`tel:${
                            app.customer.company_phone || app.customer.phone
                          }`}
                          className="hover:text-purple-600 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {app.customer.company_phone || app.customer.phone}
                        </a>
                      </>
                    )}
                  </div>
                  {isBusiness && app.customer.company_name && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {app.customer.full_name} • Owner
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={onCopyEmail}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                  {isBusiness && (
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Company Details */}
            {isExpanded && isBusiness && app.customer && (
              <CompanyDetails customer={app.customer} />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/worker/dashboard/chat/${app.job_id}?customer=${app.job.customer_id}`}
            className="flex-1 px-3 py-2 bg-linear-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </Link>
          <Link
            href={`/worker/dashboard/job/${app.job_id}`}
            className="flex-1 px-3 py-2 bg-linear-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
          >
            <span>Details</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
