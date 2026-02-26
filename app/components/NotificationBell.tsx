"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  Bell,
  MessageSquare,
  Briefcase,
  CreditCard,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

type Notification = {
  id: string;
  user_id: string;
  type: "application" | "message" | "job_status" | "payment" | "review";
  title: string;
  content: string;
  data: any;
  read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast(); // 👈 Hook pour les toasts

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load existing notifications
  useEffect(() => {
    if (!currentUser) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        setNotifications(data || []);
        setUnreadCount(data?.filter((n) => !n.read).length || 0);
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!currentUser) return;

    // Clean up old subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new subscription
    const channel = supabase
      .channel(`notifications:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;

          console.log("🔔 New notification received:", newNotif);

          // Update state
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // 🍞 Afficher un toast selon le type de notification
          switch (newNotif.type) {
            case "application":
              if (newNotif.title.includes("Accepted")) {
                toast.success(newNotif.content, 6000);
              } else if (newNotif.title.includes("New Application")) {
                toast.info(newNotif.content, 6000);
              } else {
                toast.info(newNotif.content, 5000);
              }
              break;

            case "message":
              toast.info(newNotif.content, 5000);
              break;

            case "job_status":
              if (newNotif.content.includes("completed")) {
                toast.success(newNotif.content, 5000);
              } else if (newNotif.content.includes("cancelled")) {
                toast.warning(newNotif.content, 5000);
              } else {
                toast.info(newNotif.content, 5000);
              }
              break;

            case "payment":
              toast.success(newNotif.content, 6000);
              break;

            case "review":
              toast.success(newNotif.content, 5000);
              break;

            default:
              toast.info(newNotif.content, 4000);
          }

          // Request permission for browser notifications
          if (Notification.permission === "default") {
            Notification.requestPermission();
          }

          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification(newNotif.title, {
              body: newNotif.content,
              icon: "/favicon.ico",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Subscription status:", status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUser, toast]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [notifications]);

  const handleNotificationClick = useCallback(
    (notif: Notification) => {
      markAsRead(notif.id);
      setShowDropdown(false);

      if (notif.data?.job_id) {
        switch (notif.type) {
          case "message":
            router.push(`/chat/${notif.data.job_id}`);
            break;
          case "application":
            if (notif.data.type === "application_accepted") {
              router.push(`/worker/dashboard/job/${notif.data.job_id}`);
            } else {
              router.push(`/customer/dashboard/job/${notif.data.job_id}`);
            }
            break;
          case "job_status":
            router.push(`/customer/dashboard/job/${notif.data.job_id}`);
            break;
          case "payment":
            router.push(`/worker/earnings`);
            break;
          case "review":
            router.push(`/worker/reviews`);
            break;
        }
      }
    },
    [markAsRead, router]
  );

  const getNotificationIcon = (type: string, title?: string) => {
    switch (type) {
      case "application":
        if (title?.includes("Accepted")) {
          return <CheckCircle className="w-5 h-5 text-green-500" />;
        }
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case "message":
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case "job_status":
        if (title?.includes("Completed")) {
          return <CheckCircle className="w-5 h-5 text-green-500" />;
        }
        if (title?.includes("Cancelled")) {
          return <XCircle className="w-5 h-5 text-red-500" />;
        }
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "payment":
        return <CreditCard className="w-5 h-5 text-purple-500" />;
      case "review":
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  No notifications
                </p>
                <p className="text-xs text-gray-500">
                  When you get notifications, they'll appear here
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                    !notif.read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notif.type, notif.title)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p
                          className={`text-sm font-medium ${
                            !notif.read ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                        {notif.content}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <Link
              href="/notifications"
              onClick={() => setShowDropdown(false)}
              className="flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View all notifications
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
