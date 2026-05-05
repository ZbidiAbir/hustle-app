"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  FlagTriangleRight,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { ToastProvider } from "@/contexts/ToastContext";
import NotificationToast from "../../components/NotificationToast";
type User = {
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [stats, setStats] = useState({
    pendingUsers: 0,
    pendingJobs: 0,
    reportedContent: 0,
  });
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

        // Récupérer le rôle depuis la table profiles
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url, role")
          .eq("id", authUser.id)
          .single();

        if (profileError || !profile) {
          console.error("Error fetching profile:", profileError);
          router.push("/login");
          return;
        }

        // Vérifier que l'utilisateur est admin
        if (profile.role !== "admin") {
          // Redirect to appropriate dashboard based on role
          if (profile.role === "worker") {
            router.push("/worker/dashboard");
          } else if (profile.role === "customer") {
            router.push("/customer/dashboard");
          } else {
            router.push("/");
          }
          return;
        }

        setUser(profile);

        // Récupérer les stats pour les badges
        const [pendingUsers, pendingJobs, reported] = await Promise.all([
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("jobs")
            .select("*", { count: "exact", head: true })
            .eq("status", "reported"),
          supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("resolved", false),
        ]);

        setStats({
          pendingUsers: pendingUsers.count || 0,
          pendingJobs: pendingJobs.count || 0,
          reportedContent: reported.count || 0,
        });
      } catch (error) {
        console.error("Error in admin layout:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/admin/dashboard",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      current: pathname === "/admin/users",
      badge: stats.pendingUsers,
    },
    {
      name: "Jobs",
      href: "/admin/jobs",
      icon: Briefcase,
      current: pathname === "/admin/jobs",
      badge: stats.pendingJobs,
    },
    {
      name: "Conversations",
      href: "/admin/convs",
      icon: MessageSquare,
      current: pathname === "/admin/convs",
    },
    {
      name: "Applications",
      href: "/admin/applications",
      icon: FileText,
      current: pathname === "/admin/applications",
    },
    {
      name: "Payments",
      href: "/admin/payments",
      icon: CreditCard,
      current: pathname === "/admin/payments",
    },
    {
      name: "Disputes",
      href: "/admin/disputes",
      icon: FlagTriangleRight,
      current: pathname === "/admin/disputes",
      badge: stats.reportedContent,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: pathname === "/admin/settings",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation - Keep the same as your existing code */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Admin</span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                  Admin Panel
                </span>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <NotificationBell />
                {stats.reportedContent > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {stats.reportedContent}
                    </span>
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold">
                    {user?.full_name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user?.full_name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

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
                        <p className="text-xs text-red-600 mt-1">
                          Administrator
                        </p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/admin/settings"
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
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                Admin Access
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-red-700">Pending Users:</span>
                <span className="font-bold text-red-900">
                  {stats.pendingUsers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Reported Jobs:</span>
                <span className="font-bold text-red-900">
                  {stats.pendingJobs}
                </span>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
                    item.current
                      ? "bg-red-50 text-red-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        item.current ? "text-red-600" : "text-gray-500"
                      }`}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  {item.badge ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Emergency Actions
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 pt-16 min-h-screen">
        <ToastProvider>
          {children}
          <NotificationToast />
        </ToastProvider>
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
