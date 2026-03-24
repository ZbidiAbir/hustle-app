import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Briefcase,
  Clock,
  Star,
  ShieldCheck,
  DollarSign,
  Info,
  ChevronUp,
  ChevronDown,
  Copy,
  PhoneCall,
  Landmark,
  Gavel,
  BadgeCheck,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { WorkerProfile } from "../../../types";
import { useFormatters } from "../../../hooks/useFormatters";
import { useIconsAndBadges } from "../../../hooks/useIconsAndBadges";

export function WorkerProfileCard({
  worker,
  completedJobsCount,
  showAllDetails,
  onToggleDetails,
  onFileDispute,
  existingDisputeStatus,
}: {
  worker: WorkerProfile;
  completedJobsCount: number;
  showAllDetails: boolean;
  onToggleDetails: () => void;
  onFileDispute: () => void;
  existingDisputeStatus?: string | null;
}) {
  const toast = useToast();
  const { formatDate, formatCurrency } = useFormatters();
  const { getTradeCategoryIcon, getLevelBadge, getDisputeStatusColor } =
    useIconsAndBadges();

  const getYearsOfExperience = (createdAt: string | undefined) => {
    if (!createdAt) return "0";
    const start = new Date(createdAt);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    return years > 0 ? `${years}+` : "<1";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Complete Profile
          </h2>
          <button
            onClick={onFileDispute}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition flex items-center gap-2 border border-red-200"
          >
            <Gavel className="w-4 h-4" />
            {existingDisputeStatus ? "Update Dispute" : "File a Dispute"}
            {existingDisputeStatus && (
              <span
                className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${getDisputeStatusColor(
                  existingDisputeStatus
                )}`}
              >
                {existingDisputeStatus}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Profile Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-purple-500 mx-auto flex items-center justify-center text-white font-bold text-3xl mb-3 border-4 border-white shadow-lg overflow-hidden">
              {worker.avatar_url ? (
                <img
                  src={worker.avatar_url}
                  alt={worker.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                worker.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            {worker.verified && (
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900">
            {worker.full_name}
          </h3>
          <p className="text-gray-600 flex items-center justify-center gap-1">
            {getTradeCategoryIcon(worker.trade_category)}
            {worker.job_title || worker.trade_category || "Professional"}
          </p>

          <div className="mt-2 flex justify-center gap-2">
            {getLevelBadge(worker.level)}
            {worker.insurance_verified && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Insured
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatItem
            icon={Briefcase}
            value={completedJobsCount}
            label="Jobs Done"
          />
          <StatItem
            icon={Clock}
            value={getYearsOfExperience(worker.created_at)}
            label="Years Exp"
          />
          <StatItem
            icon={Star}
            value={worker.rating?.toFixed(1) || "New"}
            label="Rating"
          />
        </div>

        {/* Contact Info */}
        <div className="space-y-3 mb-4">
          <ContactItem
            icon={Mail}
            value={worker.email}
            onCopy={() => navigator.clipboard.writeText(worker.email)}
          />
          {worker.phone && (
            <ContactItem
              icon={Phone}
              value={worker.phone}
              href={`tel:${worker.phone}`}
            />
          )}
          {(worker.address || worker.city) && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 truncate">
                {[worker.address, worker.city, worker.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Award className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Member since {formatDate(worker.created_at || "")}
            </span>
          </div>
        </div>

        {/* Skills */}
        {worker.skills && worker.skills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1">
              {worker.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rate Information */}
        {worker.rate_type && (
          <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Rate Information
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 capitalize">
                {worker.rate_type} Rate
              </span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(worker.hourly_rate)}
                {worker.rate_type === "hourly" && "/hr"}
              </span>
            </div>
          </div>
        )}

        {/* Toggle Details Button */}
        <button
          onClick={onToggleDetails}
          className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium mb-4 flex items-center justify-center gap-1 p-2 hover:bg-purple-50 rounded-lg transition"
        >
          <Info className="w-4 h-4" />
          {showAllDetails ? "Show less" : "Show all details"}
          {showAllDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Expanded Details */}
        {showAllDetails && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900">
              Additional Information
            </h4>

            {worker.bank_name && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Landmark className="w-3 h-3" />
                  Bank Information
                </p>
                <div className="pl-4 space-y-1">
                  <p className="text-sm text-gray-600">
                    Bank: {worker.bank_name}
                  </p>
                  {worker.bank_account_holder && (
                    <p className="text-sm text-gray-600">
                      Holder: {worker.bank_account_holder}
                    </p>
                  )}
                </div>
              </div>
            )}

            {worker.trade_category && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">
                  Trade Category
                </p>
                <p className="text-sm text-gray-900 capitalize">
                  {worker.trade_category.replace("_", " ")}
                </p>
              </div>
            )}

            {(worker.address || worker.city) && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">
                  Full Address
                </p>
                <p className="text-sm text-gray-900">
                  {[
                    worker.address,
                    worker.city,
                    worker.country,
                    worker.zip_code,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Composants utilitaires internes
function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: number | string;
  label: string;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl text-center">
      <Icon className="w-4 h-4 text-gray-500 mx-auto mb-1" />
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  value,
  href,
  onCopy,
}: {
  icon: any;
  value: string;
  href?: string;
  onCopy?: () => void;
}) {
  const toast = useToast();

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      toast.success("Copied!");
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-600 truncate flex-1">{value}</span>
      {href ? (
        <a
          href={href}
          className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition"
        >
          <PhoneCall className="w-3 h-3 text-gray-400" />
        </a>
      ) : (
        onCopy && (
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition"
          >
            <Copy className="w-3 h-3 text-gray-400" />
          </button>
        )
      )}
    </div>
  );
}
