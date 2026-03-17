export const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

export const formatConversationTime = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

export const getAvatarColor = (id: string) => {
  const colors = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-yellow-500 to-amber-500",
    "from-red-500 to-rose-500",
    "from-indigo-500 to-violet-500",
    "from-orange-500 to-red-500",
    "from-teal-500 to-green-500",
  ];
  const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
  return colors[index];
};

export const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getStatusColor = (status: string) => {
  const colors = {
    open: "bg-green-100 text-green-700 border-green-200",
    assigned: "bg-blue-100 text-blue-700 border-blue-200",
    in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
    completed: "bg-purple-100 text-purple-700 border-purple-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    colors[status as keyof typeof colors] ||
    "bg-gray-100 text-gray-700 border-gray-200"
  );
};

export const getStatusText = (status: string) => {
  const texts = {
    open: "Open",
    assigned: "Assigned",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return texts[status as keyof typeof texts] || status;
};

export const getUrgencyColor = (urgency: string) => {
  const colors = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
    flexible: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    colors[urgency?.toLowerCase() as keyof typeof colors] || colors.flexible
  );
};
export const messageUtils = {
  // Formater l'heure des messages
  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  },

  // Obtenir une couleur d'avatar basée sur l'ID
  getAvatarColor(id: string): string {
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
  },

  // Obtenir la classe de statut
  getStatusClass(status: string): string {
    const statusClasses = {
      assigned: "bg-blue-100 text-blue-700",
      in_progress: "bg-amber-100 text-amber-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      pending: "bg-gray-100 text-gray-700",
    };
    return (
      statusClasses[status as keyof typeof statusClasses] ||
      statusClasses.pending
    );
  },
};
