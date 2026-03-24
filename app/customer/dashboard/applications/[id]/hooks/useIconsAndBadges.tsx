import {
  Wrench,
  Droplets,
  Zap,
  Hammer,
  Paintbrush,
  Thermometer,
  TreePine,
  Sparkles,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

export function useIconsAndBadges() {
  const getTradeCategoryIcon = (category: string | undefined) => {
    const icons: Record<string, any> = {
      plumbing: Droplets,
      electrical: Zap,
      carpentry: Hammer,
      painting: Paintbrush,
      hvac: Thermometer,
      landscaping: TreePine,
      cleaning: Sparkles,
      moving: Truck,
    };
    const Icon = icons[category?.toLowerCase() || ""] || Wrench;
    return <Icon className="w-4 h-4" />;
  };

  const getLevelBadge = (level: string | undefined | null) => {
    const badges: Record<string, { color: string; label: string }> = {
      beginner: { color: "bg-gray-100 text-gray-700", label: "Beginner" },
      intermediate: {
        color: "bg-purple-100 text-purple-700",
        label: "Intermediate",
      },
      expert: { color: "bg-purple-100 text-purple-700", label: "Expert" },
      master: { color: "bg-yellow-100 text-yellow-700", label: "Master" },
    };

    if (!level || !badges[level]) return null;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badges[level].color}`}
      >
        {badges[level].label}
      </span>
    );
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { color: string; bgColor: string; icon: any; label: string }
    > = {
      pending: {
        color: "text-yellow-800",
        bgColor: "bg-yellow-100",
        icon: Clock,
        label: "Pending Review",
      },
      accepted: {
        color: "text-green-800",
        bgColor: "bg-green-100",
        icon: CheckCircle,
        label: "Accepted",
      },
      rejected: {
        color: "text-red-800",
        bgColor: "bg-red-100",
        icon: XCircle,
        label: "Rejected",
      },
    };
    return configs[status] || configs.pending;
  };

  const getDisputeStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      under_review: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      dismissed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getJobStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-100 text-green-800",
      assigned: "bg-purple-100 text-purple-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return {
    getTradeCategoryIcon,
    getLevelBadge,
    getStatusConfig,
    getDisputeStatusColor,
    getJobStatusColor,
  };
}
