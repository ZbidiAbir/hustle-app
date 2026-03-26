// hooks/useNotifications.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  type: "application" | "message" | "job_status" | "payment" | "review";
  title: string;
  content: string;
  data: any;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      console.log(
        `📥 Chargé ${data?.length} notifications pour user ${user.id}`
      );
      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.read).length || 0);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
      console.error("Erreur:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Erreur:", error);
    }
  }, [user?.id]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", notificationId);

        if (error) throw error;

        const deletedNotification = notifications.find(
          (n) => n.id === notificationId
        );
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    },
    [notifications]
  );

  // Écoute en temps réel - SANS FILTRE (solution pour customer)
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    console.log(`🔔 [${user.id}] Démarrage écoute notifications (sans filtre)`);
    fetchNotifications();

    // Canal SANS FILTRE - on écoute TOUTES les notifications
    const channel = supabase
      .channel(`notifications-all-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          // PAS DE FILTRE ! On écoute toutes les insertions
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          // On filtre côté client pour ne garder que celles de l'utilisateur
          if (newNotification.user_id === user.id) {
            console.log(`🎯 [${user.id}] Notification reçue en temps réel!`, {
              id: newNotification.id,
              title: newNotification.title,
              type: newNotification.type,
            });
            setNotifications((prev) => [newNotification, ...prev]);
            if (!newNotification.read) {
              setUnreadCount((prev) => prev + 1);
            }
          } else {
            console.log(`⏭️ [${user.id}] Notification ignorée (autre user)`);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          if (updatedNotification.user_id === user.id) {
            console.log(
              `🔄 [${user.id}] Notification mise à jour:`,
              updatedNotification.id
            );
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [${user.id}] Statut canal:`, status);
      });

    return () => {
      console.log(`🔌 [${user.id}] Fermeture canal`);
      channel.unsubscribe();
    };
  }, [user?.id, fetchNotifications]);

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
