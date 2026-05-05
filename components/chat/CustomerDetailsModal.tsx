import { formatJobPrice } from "@/modules/chat/utils/jobs";
import { Customer, Job } from "@/modules/chat/types/chat.types";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  Home,
  Mail,
  MapPin,
  Phone,
  Star,
  User,
  X,
} from "lucide-react";

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

export default CustomerDetailsModal;
