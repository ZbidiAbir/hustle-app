import { Job } from "@/modules/chat/types/chat.types";
import { Clock, DollarSign, TrendingUp } from "lucide-react";

// Fonction pour formater le prix selon le type
export const formatJobPrice = (job: Job | null) => {
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
export const getPriceTypeInfo = (job: Job | null) => {
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
