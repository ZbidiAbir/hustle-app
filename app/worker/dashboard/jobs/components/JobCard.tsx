import Link from "next/link";
import {
  MapPin,
  Calendar,
  Briefcase,
  MessageSquare,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Store,
  Home,
  BadgeCheck,
  DollarSign,
  Wrench,
  HardHat,
  Users,
  Package,
  Clock3,
  Zap,
  Award,
} from "lucide-react";
import { Job } from "@/types/job";
import { useJobCard } from "@/lib/hooks/useJobCard";

interface JobCardProps {
  job: Job;
  onChatClick: (jobId: string) => void;
}

export function JobCard({ job, onChatClick }: JobCardProps) {
  const {
    getApplicationBadge,
    getUrgencyIcon,
    getProjectSizeIcon,
    getDisplayPrice,
    getCustomerDisplayName,
    getCustomerIcon,
    getCustomerAvatar,
    getAvatarColor,
    formatDate,
    formatJobDate,
  } = useJobCard();

  const displayPrice = getDisplayPrice(job);

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all overflow-hidden group relative">
      {/* Application Status Badge */}
      {job.application_status && getApplicationBadge(job.application_status)}

      <div className="p-4">
        {/* Category, Urgency, and Date */}
        <div className="flex items-center gap-2 mb-2 flex-wrap pt-8">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            {job.category}
          </span>

          {job.urgency && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
              {getUrgencyIcon(job.urgency)}
              {job.urgency}
            </span>
          )}

          <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
            <Clock3 className="w-3 h-3" />
            {formatDate(job.created_at)}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
          {job.title}
        </h2>

        {/* Description */}
        {job.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {job.description}
          </p>
        )}

        {/* Job Details Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Location */}
          {job.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
          )}

          {/* Project Size */}
          {job.project_size && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {getProjectSizeIcon(job.project_size)}
              <span className="truncate">{job.project_size}</span>
            </div>
          )}

          {/* Level Required */}
          {job.level_required && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Award className="w-3 h-3" />
              <span className="truncate capitalize">{job.level_required}</span>
            </div>
          )}

          {/* Materials */}
          {job.materials_provided !== undefined && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Package className="w-3 h-3" />
              <span>
                {job.materials_provided
                  ? "Materials provided"
                  : "BYO materials"}
              </span>
            </div>
          )}
        </div>

        {/* Date and Time */}
        {(job.date || job.time_slot) && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded-lg">
            <Calendar className="w-3 h-3 text-blue-500" />
            <span>
              {job.date && formatJobDate(job.date)}
              {job.time_slot && ` • ${job.time_slot}`}
            </span>
          </div>
        )}

        {/* Customer Info */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {/* Customer Avatar/Logo */}
            <div className="relative">
              {getCustomerAvatar(job.customer) || (
                <div
                  className={`w-8 h-8 rounded-full bg-linear-to-r ${getAvatarColor(
                    job.customer_id
                  )} flex items-center justify-center text-white text-xs font-medium shadow-sm`}
                >
                  {getCustomerDisplayName(job.customer).charAt(0).toUpperCase()}
                </div>
              )}
              {job.customer?.business_verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <BadgeCheck className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Customer Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {getCustomerIcon(job.customer)}
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getCustomerDisplayName(job.customer)}
                </p>
              </div>
              <p className="text-xs text-gray-500 truncate">
                {job.customer?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Price Display */}
        {displayPrice && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {displayPrice.label}
              </span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-blue-600" />
                <span className="font-bold text-blue-600">
                  {typeof displayPrice.amount === "number"
                    ? displayPrice.amount
                    : displayPrice.amount}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onChatClick(job.id)}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <Link
            href={`/worker/dashboard/job/${job.id}`}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
          >
            <span>Details</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Applied date if applicable */}
        {job.applied_at && (
          <p className="text-xs text-gray-400 mt-2 text-right flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
            Applied {formatDate(job.applied_at)}
          </p>
        )}
      </div>
    </div>
  );
}
