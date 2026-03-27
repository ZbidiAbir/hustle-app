"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Briefcase,
  MessageSquare,
  DollarSign,
  Star,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

type ToastNotification = {
  id: string;
  title: string;
  content: string;
  type: string;
  data?: any;
  created_at: string;
  read: boolean;
};

/*
  Helpers localStorage persistence
*/

const STORAGE_KEY = "shownToastIds";

const getStoredToastIds = () => {
  if (typeof window === "undefined") return new Set<string>();

  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) return new Set<string>();

  try {
    return new Set(JSON.parse(stored));
  } catch {
    return new Set<string>();
  }
};

const storeToastIds = (ids: Set<string>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
};

export default function NotificationToast() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const { notifications, markAsRead } = useNotifications();
  const { profile } = useAuth();

  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const shownToastIdsRef = useRef<Set<string>>(
    //@ts-ignore
    getStoredToastIds()
  );

  /*
    Reset localStorage when user changes
  */

  useEffect(() => {
    //@ts-ignore
    shownToastIdsRef.current = getStoredToastIds();
  }, [profile?.id]);

  /*
    Add new unread notifications as toasts
  */

  useEffect(() => {
    if (!notifications?.length) return;

    const newUnread = notifications.filter(
      (n) => !n.read && !shownToastIdsRef.current.has(n.id)
    );

    if (!newUnread.length) return;

    setToasts((prev) => {
      const filtered = newUnread.filter(
        (n) => !prev.some((p) => p.id === n.id)
      );

      if (!filtered.length) return prev;

      filtered.forEach((toast) => shownToastIdsRef.current.add(toast.id));

      storeToastIds(shownToastIdsRef.current);

      return [...prev, ...filtered];
    });
  }, [notifications]);

  /*
    Auto remove toast after 5 seconds
  */

  useEffect(() => {
    toasts.forEach((toast) => {
      if (!timeoutRefs.current.has(toast.id)) {
        const timeout = setTimeout(() => {
          removeToast(toast.id);
        }, 5000);

        timeoutRefs.current.set(toast.id, timeout);
      }
    });

    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current.clear();
    };
  }, [toasts]);

  /*
    Remove toast manually or automatically
  */

  const removeToast = (id: string) => {
    const timeout = timeoutRefs.current.get(id);

    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }

    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /*
    Icon selector
  */

  const getIcon = (type: string, data?: any) => {
    if (
      data?.dispute_type ||
      data?.type === "new_dispute" ||
      data?.type === "admin_review_needed"
    ) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }

    switch (type) {
      case "application":
        return <Briefcase className="w-5 h-5 text-blue-500" />;

      case "message":
        return <MessageSquare className="w-5 h-5 text-green-500" />;

      case "job_status":
        if (data?.status === "completed")
          return <CheckCircle className="w-5 h-5 text-emerald-500" />;

        if (data?.status === "cancelled")
          return <AlertTriangle className="w-5 h-5 text-red-500" />;

        return <Briefcase className="w-5 h-5 text-purple-500" />;

      case "payment":
        return <DollarSign className="w-5 h-5 text-yellow-500" />;

      case "review":
        return <Star className="w-5 h-5 text-orange-500" />;

      default:
        return <Briefcase className="w-5 h-5 text-gray-500" />;
    }
  };

  /*
    Background selector
  */

  const getBgColor = (type: string, data?: any) => {
    if (
      data?.dispute_type ||
      data?.type === "new_dispute" ||
      data?.type === "admin_review_needed"
    ) {
      return "bg-red-50 border-red-200";
    }

    switch (type) {
      case "application":
        return "bg-blue-50 border-blue-200";

      case "message":
        return "bg-green-50 border-green-200";

      case "job_status":
        if (data?.status === "completed")
          return "bg-emerald-50 border-emerald-200";

        if (data?.status === "cancelled") return "bg-red-50 border-red-200";

        return "bg-purple-50 border-purple-200";

      case "payment":
        return "bg-yellow-50 border-yellow-200";

      case "review":
        return "bg-orange-50 border-orange-200";

      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  /*
    Redirect handler
  */

  const handleClick = useCallback(
    async (toast: ToastNotification) => {
      if (!toast.read) {
        await markAsRead(toast.id);
      }

      const basePath =
        profile?.role === "customer"
          ? "/customer/dashboard"
          : profile?.role === "worker"
          ? "/worker/dashboard"
          : "/admin/dashboard";

      if (toast.data?.type === "new_message" && toast.data?.job_id) {
        window.location.href = `${basePath}/chat/${toast.data.job_id}`;
      } else if (
        toast.data?.dispute_type ||
        toast.data?.type === "admin_review_needed"
      ) {
        window.location.href =
          profile?.role === "admin"
            ? `${basePath}/disputes`
            : `${basePath}/my-disputes`;
      } else if (toast.data?.job_id) {
        window.location.href =
          profile?.role === "worker"
            ? `${basePath}/my-jobs?job_id=${toast.data.job_id}`
            : `${basePath}/my-jobs/${toast.data.job_id}`;
      } else if (toast.data?.type === "new_review") {
        window.location.href = `${basePath}/reviews`;
      } else if (toast.data?.type === "payment_processed") {
        window.location.href = `${basePath}/payments`;
      }

      removeToast(toast.id);
    },
    [profile, markAsRead]
  );

  const formatTime = (date: string) =>
    formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: enUS,
    });

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-h-screen overflow-y-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleClick(toast)}
          className={`relative max-w-sm w-80 bg-white rounded-xl shadow-lg border ${getBgColor(
            toast.type,
            toast.data
          )} animate-slide-up cursor-pointer hover:shadow-xl transition-all`}
        >
          <div className="p-3 flex gap-2">
            {getIcon(toast.type, toast.data)}

            <div className="flex-1">
              <div className="flex justify-between">
                <p className="text-sm font-semibold">{toast.title}</p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToast(toast.id);
                  }}
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>

              <p className="text-xs text-gray-600 mt-1">{toast.content}</p>

              <p className="text-xs text-gray-400 mt-1">
                {formatTime(toast.created_at)}
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-shrink" />
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        .animate-shrink {
          animation: shrink 5s linear forwards;
        }
      `}</style>
    </div>
  );
}
