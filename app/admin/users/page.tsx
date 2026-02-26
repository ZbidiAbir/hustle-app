"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  ChevronDown,
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
} from "lucide-react";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: "customer" | "worker" | "admin";
  avatar_url?: string;
  phone?: string;
  location?: string;
  verified: boolean;
  status: "active" | "suspended" | "pending";
  rating?: number;
  jobs_completed?: number;
  created_at: string;
  last_active?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    workers: 0,
    admins: 0,
    active: 0,
    suspended: 0,
    pending: 0,
    verified: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrichir avec des données simulées pour la démo
      const enrichedUsers = (data || []).map((user, index) => ({
        ...user,
        verified: Math.random() > 0.3,
        status: ["active", "suspended", "pending"][
          Math.floor(Math.random() * 3)
        ] as "active" | "suspended" | "pending",
        rating: user.role === "worker" ? 4 + Math.random() : undefined,
        jobs_completed:
          user.role === "worker" ? Math.floor(Math.random() * 50) : undefined,
        location: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][
          Math.floor(Math.random() * 5)
        ],
        last_active: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }));

      setUsers(enrichedUsers);

      // Calculer les statistiques
      setStats({
        total: enrichedUsers.length,
        customers: enrichedUsers.filter((u) => u.role === "customer").length,
        workers: enrichedUsers.filter((u) => u.role === "worker").length,
        admins: enrichedUsers.filter((u) => u.role === "admin").length,
        active: enrichedUsers.filter((u) => u.status === "active").length,
        suspended: enrichedUsers.filter((u) => u.status === "suspended").length,
        pending: enrichedUsers.filter((u) => u.status === "pending").length,
        verified: enrichedUsers.filter((u) => u.verified).length,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.phone?.toLowerCase().includes(term) ||
          user.location?.toLowerCase().includes(term)
      );
    }

    // Filtre par rôle
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
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

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    const confirmMessage = `Are you sure you want to ${action} ${selectedUsers.length} user(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      // Implémenter les actions groupées
      console.log(`Bulk ${action}:`, selectedUsers);

      // Rafraîchir la liste
      await fetchUsers();
      setSelectedUsers([]);
      setSelectAll(false);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      // Implémenter le changement de statut
      console.log(`Change user ${userId} status to ${newStatus}`);

      // Mettre à jour l'état local
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, status: newStatus as any } : u
        )
      );
    } catch (error) {
      console.error("Error changing user status:", error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users on the platform</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchUsers}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition ${
              showFilters || roleFilter !== "all" || statusFilter !== "all"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {roleFilter !== "all" || statusFilter !== "all"}
          </button>

          {/* Export Button */}
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Download className="w-4 h-4 text-gray-600" />
            Export
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customers</option>
                <option value="worker">Workers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-red-700">
            <strong>{selectedUsers.length}</strong> user(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("verify")}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
            >
              Verify
            </button>
            <button
              onClick={() => handleBulkAction("suspend")}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition"
            >
              Suspend
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Status
                </th>

                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Last Active
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold">
                        {user.full_name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
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
                    {user.role === "worker" && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">
                          {user.rating?.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({user.jobs_completed} jobs)
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : user.status === "suspended"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {user.location || "N/A"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(user.last_active)}
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
                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        className="p-1 hover:bg-gray-100 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Link>
                      <div className="relative group">
                        <button className="p-1 hover:bg-gray-100 rounded-lg transition">
                          <MoreHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border hidden group-hover:block z-10">
                          {user.status === "active" ? (
                            <button
                              onClick={() =>
                                handleStatusChange(user.id, "suspended")
                              }
                              className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50"
                            >
                              <Ban className="w-4 h-4 inline mr-2" />
                              Suspend User
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleStatusChange(user.id, "active")
                              }
                              className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="w-4 h-4 inline mr-2" />
                              Activate User
                            </button>
                          )}

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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-500">
              {searchTerm || roleFilter !== "all" || statusFilter !== "all"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{filteredUsers.length}</span> of{" "}
              <span className="font-medium">{filteredUsers.length}</span> users
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                1
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                2
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                3
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
