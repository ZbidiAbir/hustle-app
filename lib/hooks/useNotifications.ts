// lib/hooks/useNotifications.ts
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  data: any;
  read: boolean;
  created_at: string;
};

// Store global state outside the hook to make it a singleton
let globalNotifications: Notification[] = [];
let globalUnreadCount = 0;
let listeners: (() => void)[] = [];
let subscription: any = null;

export function useNotifications() {
  const [notifications, setNotifications] =
    useState<Notification[]>(globalNotifications);
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const notifyListeners = useCallback(() => {
    listeners.forEach((listener) => listener());
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      globalNotifications = data || [];
      globalUnreadCount = globalNotifications.filter((n) => !n.read).length;

      setNotifications(globalNotifications);
      setUnreadCount(globalUnreadCount);
      notifyListeners();
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, notifyListeners]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", id);

        if (error) throw error;

        globalNotifications = globalNotifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        globalUnreadCount = globalNotifications.filter((n) => !n.read).length;

        setNotifications(globalNotifications);
        setUnreadCount(globalUnreadCount);
        notifyListeners();
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [notifyListeners]
  );

  const markAllAsRead = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", profile.id)
        .eq("read", false);

      if (error) throw error;

      globalNotifications = globalNotifications.map((n) => ({
        ...n,
        read: true,
      }));
      globalUnreadCount = 0;

      setNotifications(globalNotifications);
      setUnreadCount(0);
      notifyListeners();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [profile?.id, notifyListeners]);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", id);

        if (error) throw error;

        globalNotifications = globalNotifications.filter((n) => n.id !== id);
        globalUnreadCount = globalNotifications.filter((n) => !n.read).length;

        setNotifications(globalNotifications);
        setUnreadCount(globalUnreadCount);
        notifyListeners();
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [notifyListeners]
  );

  // Set up real-time subscription
  useEffect(() => {
    if (!profile?.id) return;

    const setupSubscription = async () => {
      await fetchNotifications();

      // Only create one subscription
      if (subscription) return;

      subscription = supabase
        .channel("notifications-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profile.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            globalNotifications = [newNotification, ...globalNotifications];
            globalUnreadCount += 1;

            setNotifications(globalNotifications);
            setUnreadCount(globalUnreadCount);
            notifyListeners();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profile.id}`,
          },
          (payload) => {
            const updated = payload.new as Notification;
            globalNotifications = globalNotifications.map((n) =>
              n.id === updated.id ? updated : n
            );
            globalUnreadCount = globalNotifications.filter(
              (n) => !n.read
            ).length;

            setNotifications(globalNotifications);
            setUnreadCount(globalUnreadCount);
            notifyListeners();
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    };
  }, [profile?.id, fetchNotifications, notifyListeners]);

  // Listen for global state changes
  useEffect(() => {
    const handleStateChange = () => {
      setNotifications(globalNotifications);
      setUnreadCount(globalUnreadCount);
    };

    listeners.push(handleStateChange);
    return () => {
      listeners = listeners.filter((l) => l !== handleStateChange);
    };
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
