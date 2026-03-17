import { useCallback } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Calendar,
  Clock3,
  Wrench,
  HardHat,
  Users,
  Briefcase,
  Store,
  Home,
} from "lucide-react";
import { Profile } from "@/types/profile";
import { DisplayPrice, Job } from "@/types/job";

export function useJobCard() {
  const getAvatarColor = useCallback((id: string) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-red-500 to-red-600",
      "from-yellow-500 to-yellow-600",
      "from-pink-500 to-pink-600",
      "from-indigo-500 to-indigo-600",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  }, []);

  const formatJobDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return "Flexible";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  const getApplicationBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return (
          <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 z-10">
            <Clock className="w-3 h-3" />
            Applied
          </div>
        );
      case "accepted":
        return (
          <div className="absolute top-2 left-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 z-10">
            <CheckCircle className="w-3 h-3" />
            Accepted
          </div>
        );
      case "rejected":
        return (
          <div className="absolute top-2 left-2 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium z-10">
            Rejected
          </div>
        );
      default:
        return null;
    }
  };

  const getUrgencyIcon = (urgency: string | undefined) => {
    switch (urgency?.toLowerCase()) {
      case "urgent":
        return <Zap className="w-3 h-3 text-red-500" />;
      case "normal":
        return <Clock3 className="w-3 h-3 text-blue-500" />;
      default:
        return <Calendar className="w-3 h-3 text-gray-400" />;
    }
  };

  const getProjectSizeIcon = (size: string | undefined) => {
    switch (size?.toLowerCase()) {
      case "small":
        return <Wrench className="w-3 h-3 text-green-500" />;
      case "medium":
        return <HardHat className="w-3 h-3 text-yellow-500" />;
      case "large":
        return <Users className="w-3 h-3 text-purple-500" />;
      default:
        return <Briefcase className="w-3 h-3 text-gray-400" />;
    }
  };

  const getDisplayPrice = (job: Job): DisplayPrice | null => {
    if (job.pay_type === "fixed" && job.fixed_rate) {
      return {
        amount: job.fixed_rate,
        label: "Fixed price",
      };
    } else if (job.pay_type === "hourly" && job.hourly_rate) {
      return {
        amount: job.hourly_rate,
        label: "per hour",
      };
    } else if (job.min_rate && job.max_rate) {
      return {
        amount: `${job.min_rate} - ${job.max_rate}`,
        label: "range",
      };
    } else if (job.price) {
      return {
        amount: job.price,
        label: "Budget",
      };
    }
    return null;
  };

  const getCustomerDisplayName = (customer: Profile | undefined) => {
    if (!customer) return "Client";
    if (customer.account_type === "smallbusiness" && customer.company_name) {
      return customer.company_name;
    }
    return customer.full_name || "Client";
  };

  const getCustomerIcon = (customer: Profile | undefined) => {
    if (!customer) return null;
    if (customer.account_type === "smallbusiness") {
      return <Store className="w-3 h-3 text-blue-500" />;
    } else if (customer.account_type === "homeowner") {
      return <Home className="w-3 h-3 text-green-500" />;
    }
    return null;
  };

  const getCustomerAvatar = (customer: Profile | undefined) => {
    if (!customer) return null;

    if (
      customer.account_type === "smallbusiness" &&
      customer.company_logo_url
    ) {
      return (
        <img
          src={customer.company_logo_url}
          alt={customer.company_name || "Company"}
          className="w-8 h-8 rounded-lg object-cover border border-gray-200"
        />
      );
    }

    if (customer.avatar_url) {
      return (
        <img
          src={customer.avatar_url}
          alt={customer.full_name || "User"}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }

    return null;
  };

  return {
    getAvatarColor,
    formatDate,
    formatJobDate,
    getApplicationBadge,
    getUrgencyIcon,
    getProjectSizeIcon,
    getDisplayPrice,
    getCustomerDisplayName,
    getCustomerIcon,
    getCustomerAvatar,
  };
}
