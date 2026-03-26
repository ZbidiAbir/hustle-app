import { Conversation } from "@/types/messages.types";
import { messageUtils } from "@/utils/messages.utils";
import { Briefcase, MapPin, Calendar } from "lucide-react";

interface JobInfoBarProps {
  conversation: Conversation;
}

// Helper function to format price based on pay_type
const formatJobPrice = (conversation: Conversation) => {
  const { pay_type, fixed_rate, min_rate, max_rate, hourly_rate, price } =
    conversation;

  console.log("Formatting price with values:", {
    pay_type,
    fixed_rate,
    min_rate,
    max_rate,
    hourly_rate,
    price,
  });

  // Si pas de pay_type, utiliser l'ancien champ price
  if (!pay_type) {
    if (price) return `$${price}`;
    return null;
  }

  // Convertir pay_type en minuscules pour la comparaison
  const type = String(pay_type).toLowerCase().trim();

  switch (type) {
    case "fixed":
      if (fixed_rate) {
        return `$${fixed_rate}`;
      }
      if (price) return `$${price}`;
      return null;

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
      if (price) return `$${price}`;
      return null;

    case "hourly":
      if (hourly_rate) {
        return `$${hourly_rate}/hr`;
      }
      if (price) return `$${price}/hr`;
      return null;

    default:
      if (price) return `$${price}`;
      return null;
  }
};

export const JobInfoBar: React.FC<JobInfoBarProps> = ({ conversation }) => {
  console.log("=== JOB INFO BAR DEBUG ===");
  console.log("Full conversation object:", conversation);
  console.log("pay_type:", conversation.pay_type);
  console.log("fixed_rate:", conversation.fixed_rate);
  console.log("min_rate:", conversation.min_rate);
  console.log("max_rate:", conversation.max_rate);
  console.log("hourly_rate:", conversation.hourly_rate);
  console.log("price:", conversation.price);
  console.log("===========================");

  const priceDisplay = formatJobPrice(conversation);

  console.log("Price display result:", priceDisplay);

  // Vérifier si conversation existe
  if (!conversation) {
    console.log("No conversation data");
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 text-sm overflow-x-auto">
      {/* Price */}
      <div className="flex items-center gap-1 text-gray-600 whitespace-nowrap">
        <Briefcase className="w-4 h-4" />
        {priceDisplay ? (
          <span className="font-medium">{priceDisplay}</span>
        ) : (
          <span className="text-gray-500">Price not specified</span>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 text-gray-600 whitespace-nowrap">
        <MapPin className="w-4 h-4" />
        <span>{conversation.location || "Location not specified"}</span>
      </div>

      {/* Date if available */}
      {conversation.date && (
        <div className="flex items-center gap-1 text-gray-600 whitespace-nowrap">
          <Calendar className="w-4 h-4" />
          <span>{new Date(conversation.date).toLocaleDateString()}</span>
        </div>
      )}

      {/* Job status */}
      <span
        className={`ml-auto text-xs px-2 py-1 rounded-full whitespace-nowrap ${messageUtils.getStatusClass(
          conversation.status
        )}`}
      >
        Job{" "}
        {conversation.status
          ? conversation.status.replace("_", " ")
          : "Unknown"}
      </span>
    </div>
  );
};
