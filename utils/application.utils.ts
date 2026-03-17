import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  MapPin,
  Calendar,
  Building2,
  Verified,
  Users,
  Globe,
  ExternalLink,
  BadgeCheck,
  Phone,
  Copy,
  Check,
  ChevronRight,
  MessageSquare,
  Trash2,
} from "lucide-react";
import {
  ApplicationStatus,
  JobStatus,
  StatusConfig,
} from "../types/application.types";

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export const getAvatarColor = (id: string) => {
  const colors = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-yellow-500 to-amber-500",
    "from-red-500 to-rose-500",
    "from-indigo-500 to-violet-500",
  ];
  const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
  return colors[index];
};

export const getStatusConfig = (status: ApplicationStatus): StatusConfig => {
  const configs = {
    pending: {
      icon: Clock,
      text: "Pending Review",
      bg: "bg-yellow-50",
      textColor: "text-yellow-700",
      border: "border-yellow-200",
      iconColor: "text-yellow-500",
      dot: "bg-yellow-500",
      gradient: "from-yellow-500 to-yellow-600",
      lightBg: "bg-yellow-50/50",
    },
    accepted: {
      icon: CheckCircle,
      text: "Accepted",
      bg: "bg-green-50",
      textColor: "text-green-700",
      border: "border-green-200",
      iconColor: "text-green-500",
      dot: "bg-green-500",
      gradient: "from-green-500 to-green-600",
      lightBg: "bg-green-50/50",
    },
    rejected: {
      icon: XCircle,
      text: "Rejected",
      bg: "bg-red-50",
      textColor: "text-red-700",
      border: "border-red-200",
      iconColor: "text-red-500",
      dot: "bg-red-500",
      gradient: "from-red-500 to-red-600",
      lightBg: "bg-red-50/50",
    },
  };
  return configs[status];
};

export const getJobStatusConfig = (status: JobStatus) => {
  const configs = {
    open: {
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: AlertCircle,
      text: "Open",
    },
    assigned: {
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: User,
      text: "Assigned",
    },
    in_progress: {
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: Clock,
      text: "In Progress",
    },
    completed: {
      color: "bg-purple-100 text-purple-700 border-purple-200",
      icon: CheckCircle,
      text: "Completed",
    },
    cancelled: {
      color: "bg-rose-100 text-rose-700 border-rose-200",
      icon: XCircle,
      text: "Cancelled",
    },
  };
  return configs[status];
};

export const getUrgencyColor = (urgency: string) => {
  const colors = {
    urgent: "bg-rose-100 text-rose-700 border-rose-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
    flexible: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    colors[urgency?.toLowerCase() as keyof typeof colors] || colors.flexible
  );
};
