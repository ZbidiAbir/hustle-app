import { DisplayPrice, Job } from "@/types/job";
import { Customer } from "@/types/jobDetail";
import {
  Zap,
  Clock3,
  Calendar,
  Wrench,
  HardHat,
  Users,
  Briefcase,
  Store,
  Home,
  CheckCircle,
  XCircle,
} from "lucide-react";

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatJobDate = (dateString: string | undefined) => {
  if (!dateString) return "Flexible";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const getUrgencyIcon = (urgency: string | undefined) => {
  switch (urgency?.toLowerCase()) {
    case "urgent":
      return <Zap className="w-4 h-4 text-red-500" />;
    case "normal":
      return <Clock3 className="w-4 h-4 text-blue-500" />;
    default:
      return <Calendar className="w-4 h-4 text-gray-400" />;
  }
};

export const getProjectSizeIcon = (size: string | undefined) => {
  switch (size?.toLowerCase()) {
    case "small":
      return <Wrench className="w-4 h-4 text-green-500" />;
    case "medium":
      return <HardHat className="w-4 h-4 text-yellow-500" />;
    case "large":
      return <Users className="w-4 h-4 text-purple-500" />;
    default:
      return <Briefcase className="w-4 h-4 text-gray-400" />;
  }
};

export const getDisplayPrice = (job: Job): DisplayPrice | null => {
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

export const getAvatarColor = (id: string) => {
  const colors = [
    "from-purple-500 to-purple-600",
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-red-500 to-red-600",
    "from-yellow-500 to-yellow-600",
    "from-pink-500 to-pink-600",
  ];
  const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
  return colors[index];
};

export const getCustomerDisplayName = (customer: Customer | null) => {
  if (!customer) return "Client";
  if (customer.account_type === "smallbusiness" && customer.company_name) {
    return customer.company_name;
  }
  return customer.full_name || "Client";
};

export const getCustomerIcon = (customer: Customer | null) => {
  if (!customer) return null;
  if (customer.account_type === "smallbusiness") {
    return <Store className="w-4 h-4 text-blue-500" />;
  } else if (customer.account_type === "homeowner") {
    return <Home className="w-4 h-4 text-green-500" />;
  }
  return null;
};

export const getCustomerAvatar = (customer: Customer | null) => {
  if (!customer) return null;

  if (customer.account_type === "smallbusiness" && customer.company_logo_url) {
    return (
      <img
        src={customer.company_logo_url}
        alt={customer.company_name || "Company"}
        className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-md"
      />
    );
  }

  if (customer.avatar_url) {
    return (
      <img
        src={customer.avatar_url}
        alt={customer.full_name || "User"}
        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
      />
    );
  }

  return null;
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
          <Clock3 className="w-4 h-4" />
          Pending Review
        </div>
      );
    case "accepted":
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Accepted
        </div>
      );
    case "rejected":
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          <XCircle className="w-4 h-4" />
          Rejected
        </div>
      );
    default:
      return null;
  }
};
