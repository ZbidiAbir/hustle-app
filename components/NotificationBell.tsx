// app/components/NotificationBell.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  X,
  Briefcase,
  MessageSquare,
  DollarSign,
  Star,
  CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/lib/hooks/useNotifications";

export default function NotificationBell() {
  // States
  const [isOpen, setIsOpen] = useState(false); // To open/close the menu
  const dropdownRef = useRef<HTMLDivElement>(null); // To detect clicks outside

  // Get notification data
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const { profile } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "application":
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case "message":
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case "job_status":
        return <Briefcase className="w-5 h-5 text-purple-500" />;
      case "payment":
        return <DollarSign className="w-5 h-5 text-yellow-500" />;
      case "review":
        return <Star className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };
  const handleClick = async (notification: any) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Redirect based on notification type
    const basePath =
      profile?.role === "customer"
        ? "/customer/dashboard"
        : "/worker/dashboard";

    // Handle message notifications (priority to message)
    if (
      notification.data?.type === "new_message" &&
      notification.data?.job_id
    ) {
      // Redirect to chat with job_id (conversation)
      window.location.href = `${basePath}/chat/${notification.data.job_id}`;
    }
    // Handle job-related notifications
    else if (notification.data?.job_id) {
      // Worker: redirect to /my-jobs (list)
      // Customer: redirect to /my-jobs/{job_id} (specific job)
      if (profile?.role === "worker") {
        window.location.href = `${basePath}/my-jobs?job_id=${notification.data.job_id}`;
      } else {
        window.location.href = `${basePath}/my-jobs/${notification.data.job_id}`;
      }
    }
    // Fallback for other notification types
    else if (notification.data?.type) {
      // Add other specific redirects if needed
      switch (notification.data.type) {
        case "new_review":
          // Redirect to reviews page
          window.location.href = `${basePath}/reviews`;
          break;
        case "payment_processed":
          // Redirect to payments page
          window.location.href = `${basePath}/payments`;
          break;
        default:
          // Default redirect to dashboard
          window.location.href = basePath;
      }
    }

    setIsOpen(false);
  };
  // Format date (ex: "5 minutes ago")
  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: enUS,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />

        {/* Badge with unread notifications count */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              // Loading state
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              // No notifications
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications</p>
              </div>
            ) : (
              // Notifications list
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
