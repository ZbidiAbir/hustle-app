"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Download,
  RefreshCw,
  UserPlus,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: "customer" | "worker" | "admin";
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
};

type UserWithStats = User & {
  jobs_completed?: number;
  jobs_posted?: number;
  rating?: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    workers: 0,
    admins: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Récupérer tous les profils
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!profiles) {
        setUsers([]);
        setStats({
          total: 0,
          customers: 0,
          workers: 0,
          admins: 0,
        });
        return;
      }

      // Récupérer les statistiques pour chaque utilisateur
      const usersWithStats = await Promise.all(
        profiles.map(async (user) => {
          let jobsCompleted = 0;
          let jobsPosted = 0;
          let rating = 0;

          if (user.role === "worker") {
            // Compter les jobs complétés pour ce worker
            const { count: completedCount } = await supabase
              .from("jobs")
              .select("*", { count: "exact", head: true })
              .eq("worker_id", user.id)
              .eq("status", "completed");

            jobsCompleted = completedCount || 0;

            // Calculer la note moyenne (si tu as une table reviews)
            // À adapter selon ta structure
            rating = 4.5; // Valeur par défaut si pas de reviews
          } else if (user.role === "customer") {
            // Compter les jobs postés par ce client
            const { count: postedCount } = await supabase
              .from("jobs")
              .select("*", { count: "exact", head: true })
              .eq("customer_id", user.id);

            jobsPosted = postedCount || 0;
          }

          return {
            ...user,
            jobs_completed: jobsCompleted,
            jobs_posted: jobsPosted,
            rating: rating,
          };
        })
      );

      setUsers(usersWithStats);

      // Calculer les statistiques
      setStats({
        total: usersWithStats.length,
        customers: usersWithStats.filter((u) => u.role === "customer").length,
        workers: usersWithStats.filter((u) => u.role === "worker").length,
        admins: usersWithStats.filter((u) => u.role === "admin").length,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.phone?.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
      setSelectAll(false);
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleStatusChange = async (userId: string, action: string) => {
    try {
      if (action === "delete") {
        // Note: La suppression directe d'un utilisateur n'est pas recommandée
        // Il vaut mieux désactiver le compte ou utiliser une fonction Edge
        alert(
          "User deletion requires admin privileges. Please use the Supabase dashboard."
        );
        return;
      }

      // Rafraîchir la liste
      await fetchUsers();
      setSelectedUsers([]);
      setSelectAll(false);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    const confirmMessage = `Are you sure you want to ${action} ${selectedUsers.length} user(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      for (const userId of selectedUsers) {
        await handleStatusChange(userId, action);
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all users on the platform
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total Users"
              value={stats.total}
              icon={Users}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Customers"
              value={stats.customers}
              icon={Users}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title="Workers"
              value={stats.workers}
              icon={Briefcase}
              color="bg-purple-100 text-purple-600"
            />
            <StatCard
              title="Admins"
              value={stats.admins}
              icon={Shield}
              color="bg-red-100 text-red-600"
            />
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition ${
                    showFilters || roleFilter !== "all"
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {roleFilter !== "all" && (
                    <span className="w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                      1
                    </span>
                  )}
                </button>
                <button
                  onClick={fetchUsers}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Role
                    </label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="all">All Roles</option>
                      <option value="customer">Customers</option>
                      <option value="worker">Workers</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${getAvatarColor(
                              user.id
                            )} flex items-center justify-center text-white font-semibold text-sm`}
                          >
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name || "User"}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(user.full_name)
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.full_name || "No name"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : user.role === "worker"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "worker" && (
                          <div className="text-sm">
                            <span className="font-medium">
                              {user.jobs_completed || 0}
                            </span>
                            <span className="text-gray-500 ml-1">jobs</span>
                          </div>
                        )}
                        {user.role === "customer" && (
                          <div className="text-sm">
                            <span className="font-medium">
                              {user.jobs_posted || 0}
                            </span>
                            <span className="text-gray-500 ml-1">
                              jobs posted
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-1 hover:bg-gray-100 rounded-lg transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Link>
                          <div className="relative group">
                            <button className="p-1 hover:bg-gray-100 rounded-lg transition">
                              <MoreHorizontal className="w-4 h-4 text-gray-600" />
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border hidden group-hover:block z-10">
                              <div className="py-1">
                                <Link
                                  href={`/admin/users/${user.id}/edit`}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit className="w-4 h-4 inline mr-2" />
                                  Edit User
                                </Link>
                                <button
                                  onClick={() =>
                                    handleStatusChange(user.id, "delete")
                                  }
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 inline mr-2" />
                                  Delete User
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                      />
                      <div
                        className={`w-10 h-10 rounded-full ${getAvatarColor(
                          user.id
                        )} flex items-center justify-center text-white font-semibold text-sm`}
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name || "User"}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(user.full_name)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || "No name"}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : user.role === "worker"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="ml-13 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Joined
                        </span>
                        <span className="text-sm text-gray-900">
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Stats
                        </span>
                        {user.role === "worker" && (
                          <span className="text-sm text-gray-900">
                            {user.jobs_completed || 0} jobs
                          </span>
                        )}
                        {user.role === "customer" && (
                          <span className="text-sm text-gray-900">
                            {user.jobs_posted || 0} posted
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition text-center"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                  No users found
                </h3>
                <p className="text-sm text-gray-500">
                  {searchTerm || roleFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No users have been created yet"}
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
                <p className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredUsers.length}</span>{" "}
                  users
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
