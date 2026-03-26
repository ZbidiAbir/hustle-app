import Link from "next/link";
import { useState } from "react";
import {
  ChevronLeft,
  Phone,
  Video,
  Info,
  MoreVertical,
  Briefcase,
  DollarSign,
  Clock,
  TrendingUp,
  X,
  Mail,
  MapPin,
  Building2,
  Home,
  Award,
  Star,
  Calendar,
  CheckCircle,
  Shield,
  BadgeCheck,
  User,
  MessageSquare,
} from "lucide-react";
import { CustomerAvatar } from "./CustomerAvatar";
import { Customer, Job } from "@/types/chat";

interface ChatHeaderProps {
  customer: Customer | null;
  job: Job | null;
  customerId: string;
  onInfoClick?: () => void;
}

// Fonction pour formater le prix selon le type
const formatJobPrice = (job: Job | null) => {
  if (!job) return null;

  const { pay_type, fixed_rate, min_rate, max_rate, hourly_rate, price } = job;

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
const getPriceTypeInfo = (job: Job | null) => {
  if (!job || !job.pay_type) {
    return { icon: DollarSign, label: "Price", color: "text-gray-500" };
  }

  const type = String(job.pay_type).toLowerCase().trim();

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

// Composant Modal pour les détails du customer
const CustomerDetailsModal = ({
  customer,
  job,
  onClose,
}: {
  customer: Customer | null;
  job: Job | null;
  onClose: () => void;
}) => {
  if (!customer) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Customer Details
              </h2>
              <p className="text-sm text-gray-500">Job: {job?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar et nom */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
              {customer.avatar_url ? (
                <img
                  src={customer.avatar_url}
                  alt={customer.full_name || "Customer"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (customer.full_name || customer.company_name || "C")
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {customer.full_name || customer.company_name || "Customer"}
                </h3>
                {customer.business_verified && (
                  <BadgeCheck className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {renderStars(customer.rating || 4.8)}
                  <span className="text-sm font-medium text-gray-700 ml-1">
                    {(customer.rating || 4.8).toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  {customer.jobs_posted || 24} jobs posted
                </span>
              </div>
            </div>
          </div>

          {/* Type de compte */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              {customer.account_type === "smallbusiness" ? (
                <Building2 className="w-5 h-5 text-blue-600" />
              ) : (
                <Home className="w-5 h-5 text-blue-600" />
              )}
              <h4 className="font-semibold text-gray-900">Account Type</h4>
            </div>
            <p className="text-gray-700">
              {customer.account_type === "smallbusiness"
                ? "Business Account"
                : "Homeowner Account"}
            </p>
            {customer.company_name && (
              <p className="text-sm text-gray-500 mt-1">
                Company: {customer.company_name}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              Contact Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{customer.email}</p>
                </div>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{customer.phone}</p>
                  </div>
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-gray-900">
                      {[customer.address, customer.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job Information */}
          {job && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                Job Details
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Job Title</p>
                  <p className="font-medium text-gray-900">{job.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm text-gray-700">
                      {job.category || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-gray-700">
                      {job.location || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="text-sm font-medium text-green-600">
                      {formatJobPrice(job)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm text-gray-700">
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                </div>
                {job.description && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {job.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Member Since */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                Member since {customer.member_since || "January 2024"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function ChatHeader({
  customer,
  job,
  customerId,
  onInfoClick,
}: ChatHeaderProps) {
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const priceDisplay = formatJobPrice(job);
  const priceTypeInfo = getPriceTypeInfo(job);
  const PriceIcon = priceTypeInfo.icon;

  const handleInfoClick = () => {
    setShowCustomerDetails(true);
    if (onInfoClick) onInfoClick();
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/worker/dashboard/jobs"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </Link>

              <CustomerAvatar
                customer={customer}
                customerId={customerId}
                size="md"
              />

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-gray-900">
                    {customer?.full_name ||
                      customer?.company_name ||
                      "Customer"}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                  <Briefcase className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-50">{job?.title}</span>

                  {job?.category && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="rounded-full px-2 py-0.5 bg-gray-100 text-gray-600 text-xs">
                        {job.category}
                      </span>
                    </>
                  )}

                  {priceDisplay && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          priceTypeInfo.bg || "bg-gray-50"
                        }`}
                      >
                        <PriceIcon
                          className={`w-3 h-3 ${priceTypeInfo.color}`}
                        />
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

            <button
              onClick={handleInfoClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="View customer details"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showCustomerDetails && (
        <CustomerDetailsModal
          customer={customer}
          job={job}
          onClose={() => setShowCustomerDetails(false)}
        />
      )}
    </>
  );
}
