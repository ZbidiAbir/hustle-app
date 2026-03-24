import { Calendar, DollarSign, MapPin } from "lucide-react";
import { useFormatters } from "../../hooks/useFormatters";

export function QuickStats({
  timeline,
  budget,
  location,
  rateType,
}: {
  timeline: string;
  budget: number;
  location: string;
  rateType?: string;
}) {
  const { formatDate, formatCurrency } = useFormatters();

  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-purple-900">Timeline</span>
        </div>
        <p className="text-xl font-bold text-purple-900">{timeline}</p>
        <p className="text-xs text-purple-700 mt-1">Expected start date</p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-600 rounded-lg">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-green-900">Budget</span>
        </div>
        <p className="text-xl font-bold text-green-900">
          {formatCurrency(budget)}
        </p>
        <p className="text-xs text-green-700 mt-1">
          {rateType === "hourly" ? "Hourly rate" : "Fixed price"}
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-600 rounded-lg">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-purple-900">Location</span>
        </div>
        <p className="text-lg font-semibold text-purple-900 truncate">
          {location}
        </p>
        <p className="text-xs text-purple-700 mt-1">Job site</p>
      </div>
    </div>
  );
}
