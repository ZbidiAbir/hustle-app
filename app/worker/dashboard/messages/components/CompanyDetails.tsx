import {
  Building2,
  BadgeCheck,
  MapPin,
  Calendar,
  Users,
  Globe,
  ExternalLink,
  Mail,
  Phone,
  Verified,
  Award,
} from "lucide-react";
import { Customer } from "@/types/chat";

interface CompanyDetailsProps {
  customer: Customer;
}

export function CompanyDetails({ customer }: CompanyDetailsProps) {
  const isBusiness = customer.account_type === "smallbusiness";

  if (!isBusiness) return null;

  return (
    <div className="mt-4 p-5 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
            {customer.company_logo_url ? (
              <img
                src={customer.company_logo_url}
                alt={customer.company_name || "Company logo"}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-10 h-10" />
            )}
          </div>
          {customer.business_verified && (
            <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 border-2 border-white">
              <BadgeCheck className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xl font-bold text-gray-900">
              {customer.company_name || customer.full_name}
            </h4>
            {customer.business_verified && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                <Verified className="w-3 h-3" />
                Verified Business
              </span>
            )}
          </div>

          {customer.business_description && (
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {customer.business_description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {customer.business_city && customer.business_country && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>
                  {customer.business_city}, {customer.business_country}
                </span>
              </div>
            )}

            {customer.business_year_founded && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Est. {customer.business_year_founded}</span>
              </div>
            )}

            {customer.business_employees_count && (
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-blue-500" />
                <span>{customer.business_employees_count} employees</span>
              </div>
            )}

            {customer.company_phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-blue-500" />
                <a
                  href={`tel:${customer.company_phone}`}
                  className="hover:text-blue-600"
                >
                  {customer.company_phone}
                </a>
              </div>
            )}

            {customer.company_email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-blue-500" />
                <a
                  href={`mailto:${customer.company_email}`}
                  className="hover:text-blue-600"
                >
                  {customer.company_email}
                </a>
              </div>
            )}
          </div>

          {customer.business_website && (
            <a
              href={customer.business_website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
            >
              <Globe className="w-4 h-4" />
              Visit Website
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
