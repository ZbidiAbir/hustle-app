"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Briefcase,
  ClipboardList,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  Home as HomeIcon,
  FlagTriangleRight,
} from "lucide-react";
import NotificationBell from "@/app/components/NotificationBell";
import { ToastProvider } from "@/contexts/ToastContext";
import { Profile } from "@/types/profile";
import NotificationToast from "@/app/components/NotificationToast";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error) throw error;

        // Vérifier que l'utilisateur a le rôle customer
        if (profile.role !== "customer") {
          router.push("/unauthorized");
          return;
        }

        setUser(profile);
      } catch (error) {
        console.error("Error loading user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/customer/dashboard",
      icon: Home,
    },
    {
      name: "Post a Job",
      href: "/customer/dashboard/create-job",
      icon: Briefcase,
    },
    {
      name: "My Jobs",
      href: "/customer/dashboard/my-jobs",
      icon: ClipboardList,
    },
    {
      name: "Applicants",
      href: "/customer/dashboard/applications",
      icon: Users,
    },
    {
      name: "Messages",
      href: "/customer/dashboard/messages",
      icon: MessageSquare,
    },
    {
      name: " My Disputes",
      href: "/customer/dashboard/my-disputes",
      icon: FlagTriangleRight,
    },
    {
      name: "Settings",
      href: "/customer/dashboard/profile",
      icon: Settings,
    },
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "C";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAccountTypeLabel = (accountType: Profile["account_type"]) => {
    switch (accountType) {
      case "smallbusiness":
        return "Small Business";
      case "homeowner":
        return "Homeowner";
      default:
        return "Customer";
    }
  };

  const getAccountTypeIcon = (accountType: Profile["account_type"]) => {
    switch (accountType) {
      case "smallbusiness":
        return <Building2 className="w-4 h-4" />;
      case "homeowner":
        return <HomeIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left section */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Toggle menu"
                >
                  {sidebarOpen ? (
                    <X className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Menu className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <Link
                  href="/customer/dashboard"
                  className="flex items-center gap-2"
                >
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    HUSTLE
                  </span>
                  <span className="hidden sm:inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Customer
                  </span>
                </Link>
              </div>

              {/* Right section */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <NotificationBell />

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(user?.full_name)
                      )}
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {user?.full_name?.split(" ")[0] || "User"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                              {user?.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.full_name || "User"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getInitials(user?.full_name)
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user?.full_name || "User"}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                {user?.account_type &&
                                  getAccountTypeIcon(user.account_type)}
                                <span>
                                  {getAccountTypeLabel(
                                    //@ts-ignore
                                    user.account_type
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 break-all">
                            {user?.company_name}
                          </p>
                          <p className="text-sm text-gray-500 break-all">
                            {user?.email}
                          </p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/customer/dashboard/profile"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 w-full text-left transition"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              Profile Settings
                            </span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition mt-1"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Log out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar */}
        <aside
          className={`
          fixed left-0 z-20 w-64 h-full bg-white border-r border-gray-200
          transition-transform duration-300 ease-in-out pt-16
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
        >
          <div className="h-full overflow-y-auto p-2 flex flex-col">
            {/* User profile summary */}
            <div className="mb-6 p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user?.full_name)
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 truncate text-xs">
                    {user?.full_name || "User"}
                  </p>

                  <div className="flex items-center text-sm text-gray-500">
                    <img
                      //@ts-ignore
                      src={user?.company_logo_url}
                      alt=""
                      className="w-4 h-4 rounded-full"
                    />{" "}
                    <span className="text-xs">{user?.company_name}</span>(
                    {user?.account_type})
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 flex-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.name === "Messages" && (
                      <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        3
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer links */}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <div className="space-y-2">
                <Link
                  href="/terms"
                  className="block text-xs text-gray-500 hover:text-gray-700 transition"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="/privacy"
                  className="block text-xs text-gray-500 hover:text-gray-700 transition"
                >
                  Privacy Policy
                </Link>
                <p className="text-xs text-gray-400 pt-2">
                  © 2026 HUSTLE. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:pl-64 pt-16 min-h-screen">
          <div className="">{children}</div>
        </main>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Notification Toast - placé ici à l'intérieur du ToastProvider */}
        <NotificationToast />
      </div>
    </ToastProvider>
  );
}
