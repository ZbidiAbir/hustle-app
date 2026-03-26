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
import { fr } from "date-fns/locale";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/lib/hooks/useNotifications";

export default function NotificationBell() {
  // États
  const [isOpen, setIsOpen] = useState(false); // Pour ouvrir/fermer le menu
  const dropdownRef = useRef<HTMLDivElement>(null); // Pour détecter les clics en dehors

  // Récupère les données des notifications
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const { profile } = useAuth();

  // Ferme le menu si on clique en dehors
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

  // Choisit une icône selon le type de notification
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

  // Quand on clique sur une notification
  const handleClick = async (notification: any) => {
    // Marque comme lu si pas encore lu
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Redirige selon le type de notification
    const basePath =
      profile?.role === "customer"
        ? "/customer/dashboard"
        : "/worker/dashboard";

    if (notification.data?.job_id) {
      window.location.href = `${basePath}/jobs/${notification.data.job_id}`;
    } else if (notification.data?.message_id) {
      window.location.href = `${basePath}/messages`;
    }

    setIsOpen(false);
  };

  // Formate la date (ex: "il y a 5 minutes")
  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />

        {/* Badge avec le nombre de notifications non lues */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Menu déroulant des notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          {/* En-tête */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              // État de chargement
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              // Pas de notifications
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune notification</p>
              </div>
            ) : (
              // Liste des notifications
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Icône */}
                    <div className="flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>

                    {/* Contenu */}
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

                    {/* Bouton supprimer */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Indicateur de non lu */}
                  {!notification.read && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pied de page */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <Link
                href={
                  profile?.role === "customer"
                    ? "/customer/dashboard/notifications"
                    : "/worker/dashboard/notifications"
                }
                className="text-center text-sm text-blue-600 hover:text-blue-700 block"
                onClick={() => setIsOpen(false)}
              >
                Voir toutes les notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
