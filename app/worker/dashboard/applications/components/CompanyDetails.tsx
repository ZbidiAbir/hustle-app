import {
  Building2,
  BadgeCheck,
  Verified,
  MapPin,
  Calendar,
  Users,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Profile } from "@/types/profile";

interface CompanyDetailsProps {
  customer: Profile & {
    company_name?: string;
    company_logo_url?: string;
    business_description?: string;
    business_verified?: boolean;
    business_city?: string;
    business_country?: string;
    business_year_founded?: number;
    business_employees_count?: string;
    business_website?: string;
  };
}

export function CompanyDetails({ customer }: CompanyDetailsProps) {
  const isBusiness = customer.account_type === "smallbusiness";

  if (!isBusiness) return null;

  return (
    <div className="mt-3 p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
            {customer.company_logo_url ? (
              <img
                src={customer.company_logo_url}
                alt={customer.company_name || "Company logo"}
                className="object-cover w-full h-full"
              />
            ) : (
              <Building2 className="w-8 h-8" />
            )}
          </div>
          {customer.business_verified && (
            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-white">
              <BadgeCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-semibold text-gray-900">
              {customer.company_name || customer.full_name}
            </h4>
            {customer.business_verified && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                <Verified className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          {customer.business_description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {customer.business_description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            {customer.business_city && customer.business_country && (
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span>
                  {customer.business_city}, {customer.business_country}
                </span>
              </div>
            )}
            {customer.business_year_founded && (
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span>Est. {customer.business_year_founded}</span>
              </div>
            )}
            {customer.business_employees_count && (
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="w-3 h-3 text-gray-400" />
                <span>{customer.business_employees_count} employees</span>
              </div>
            )}
          </div>

          {customer.business_website && (
            <a
              href={customer.business_website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              <Globe className="w-3 h-3" />
              Visit website
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
