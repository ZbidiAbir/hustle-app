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
  Bell,
  ChevronDown,
} from "lucide-react";
import NotificationBell from "@/app/components/NotificationBell";
import { ToastProvider } from "@/contexts/ToastContext";

type User = {
  full_name: string;
  email: string;
  avatar_url?: string;
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", authUser.id)
        .single();

      setUser(profile);
      setLoading(false);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/customer/dashboard", icon: Home },
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
    { name: "Settings", href: "/customer/dashboard/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <Link
                href="/customer/dashboard"
                className="flex items-center gap-2"
              >
                <span className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <NotificationBell />{" "}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user?.full_name?.split(" ")[0] || "User"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border z-50">
                      <div className="p-4 border-b">
                        <p className="font-medium text-gray-900">
                          {user?.full_name}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/customer/settings"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            Settings
                          </span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600"
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
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="h-full overflow-y-auto p-4">
          {/* User profile summary */}
          <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-purple-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-linear-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {user?.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {user?.full_name || "User"}
                </p>
                <p className="text-sm text-gray-500">Homeowner</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    isActive
                      ? "bg-linear-to-r from-blue-50 to-purple-50 text-blue-700"
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
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <div className="space-y-2">
              <Link
                href="/terms"
                className="block text-xs text-gray-500 hover:text-gray-700"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy"
                className="block text-xs text-gray-500 hover:text-gray-700"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-0">
          {" "}
          <ToastProvider>{children}</ToastProvider>
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
