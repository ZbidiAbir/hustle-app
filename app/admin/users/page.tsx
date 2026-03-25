"use client";

import { useEffect, useState, useMemo } from "react";
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
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Award,
  Building,
  Globe,
  CreditCard,
  FileText,
  Camera,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  BarChart,
  TrendingUp,
  PieChart,
  Activity,
  BadgeCheck,
  BadgeX,
  ThumbsUp,
} from "lucide-react";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: "customer" | "worker" | "admin";
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at?: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  zip_code?: string | null;
  job_title?: string | null;
  company_name?: string | null;
  company_logo_url?: string | null;
  company_phone?: string | null;
  company_email?: string | null;
  business_address?: string | null;
  business_city?: string | null;
  business_country?: string | null;
  business_zip_code?: string | null;
  business_website?: string | null;
  business_description?: string | null;
  business_registration_number?: string | null;
  business_employees_count?: string | null;
  business_year_founded?: number | null;
  trade_category?: string | null;
  skills?: string[] | null;
  level?: string | null;
  hourly_rate?: number | null;
  rate_type?: string | null;
  business_verified?: boolean;
  insurance_verified?: boolean;
  insurance_url?: string | null;
  loyalty_points?: number;
  payment_method?: string | null;
  bank_name?: string | null;
  bank_account_holder?: string | null;
  bank_account_number?: string | null;
  bank_routing_number?: string | null;
  card_last_four?: string | null;
  card_expiry_date?: string | null;
  card_holder_name?: string | null;
  metadata?: any;
};

type RatingStats = {
  averageRating: number | null;
  displayedRating: number | null;
  totalRatings: number;
  isEstablished: boolean;
  statusText: string;
};

type UserWithStats = User & {
  jobs_completed?: number;
  jobs_posted?: number;
  jobs_in_progress?: number;
  total_earnings?: number;
  total_spent?: number;
  rating_stats?: RatingStats;
  reviews_count?: number;
  reports_count?: number;
  last_active?: string;
  account_status: "active" | "suspended" | "pending";
  verification_status: "verified" | "partial" | "none";
};

type FilterOptions = {
  role: string;
  status: string;
  verification: string;
  dateRange: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    role: "all",
    status: "all",
    verification: "all",
    dateRange: "all",
  });
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
    active: 0,
    suspended: 0,
    pending: 0,
    verified: 0,
    partial: 0,
    unverified: 0,
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "created_at", direction: "desc" });

  const router = useRouter();

  // Fonction pour calculer les statistiques de rating selon la formule
  // Fonction pour calculer les statistiques de rating selon la formule
  const calculateRatingStats = (ratings: number[]): RatingStats => {
    const totalRatings = ratings.length;

    if (totalRatings === 0) {
      return {
        averageRating: null,
        displayedRating: null,
        totalRatings: 0,
        isEstablished: false,
        statusText: "No ratings",
      };
    }

    let averageRating: number | null = null;
    let displayedRating: number | null = null;
    let isEstablished = false;
    let statusText = "";

    if (totalRatings >= 5) {
      isEstablished = true;

      if (totalRatings >= 10) {
        // Exclure la note la plus basse
        const sortedRatings = [...ratings].sort((a, b) => a - b);
        const ratingsWithoutLowest = sortedRatings.slice(1);
        const sum = ratingsWithoutLowest.reduce((acc, r) => acc + r, 0);
        averageRating = sum / ratingsWithoutLowest.length;
        displayedRating = parseFloat(averageRating.toFixed(1));
        statusText = "Established";
      } else {
        // Moyenne arithmétique simple
        const sum = ratings.reduce((acc, r) => acc + r, 0);
        averageRating = sum / totalRatings;
        displayedRating = parseFloat(averageRating.toFixed(1));
        statusText = "Established";
      }
    } else {
      // Moins de 5 ratings
      const sum = ratings.reduce((acc, r) => acc + r, 0);
      averageRating = sum / totalRatings;
      displayedRating = null;
      // Afficher "New" pour 1 rating, "Establishing" pour 2-4 ratings
      statusText = totalRatings === 1 ? "New" : "Establishing";
    }

    return {
      averageRating,
      displayedRating,
      totalRatings,
      isEstablished,
      statusText,
    };
  };

  // Récupérer les ratings d'un worker depuis la table rates
  const fetchWorkerRatings = async (workerId: string): Promise<RatingStats> => {
    try {
      const { data: rates, error } = await supabase
        .from("rates")
        .select("rating")
        .eq("reviewee_id", workerId)
        .eq("category", "worker");

      if (error) throw error;

      const ratings = rates?.map((r) => r.rating) || [];
      return calculateRatingStats(ratings);
    } catch (error) {
      console.error(`Error fetching ratings for worker ${workerId}:`, error);
      return {
        averageRating: null,
        displayedRating: null,
        totalRatings: 0,
        isEstablished: false,
        statusText: "No ratings",
      };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filters, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredUsers]);

  const getVerificationStatus = (
    user: User
  ): "verified" | "partial" | "none" => {
    if (user.business_verified && user.insurance_verified) return "verified";
    if (user.business_verified || user.insurance_verified) return "partial";
    return "none";
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!profiles) {
        setUsers([]);
        updateStats([]);
        return;
      }

      // Récupérer les statistiques pour chaque utilisateur
      const usersWithStats = await Promise.all(
        profiles.map(async (user) => {
          let jobsCompleted = 0;
          let jobsInProgress = 0;
          let jobsPosted = 0;
          let totalEarnings = 0;
          let totalSpent = 0;
          let ratingStats: RatingStats = {
            averageRating: null,
            displayedRating: null,
            totalRatings: 0,
            isEstablished: false,
            statusText: "No ratings",
          };
          let reviewsCount = 0;
          let reportsCount = 0;

          if (user.role === "worker") {
            // Jobs complétés
            const { count: completedCount } = await supabase
              .from("jobs")
              .select("*", { count: "exact", head: true })
              .eq("worker_id", user.id)
              .eq("status", "completed");
            jobsCompleted = completedCount || 0;

            // Jobs en cours
            const { count: inProgressCount } = await supabase
              .from("jobs")
              .select("*", { count: "exact", head: true })
              .eq("worker_id", user.id)
              .in("status", ["in_progress", "assigned"]);
            jobsInProgress = inProgressCount || 0;

            // Total des gains
            const { data: completedJobs } = await supabase
              .from("jobs")
              .select("price, fixed_rate, hourly_rate")
              .eq("worker_id", user.id)
              .eq("status", "completed");

            totalEarnings =
              completedJobs?.reduce((sum, job) => {
                if (job.fixed_rate) return sum + job.fixed_rate;
                if (job.hourly_rate) return sum + job.hourly_rate * 8;
                return sum + (job.price || 0);
              }, 0) || 0;

            // Récupérer les ratings depuis la table rates
            ratingStats = await fetchWorkerRatings(user.id);
            reviewsCount = ratingStats.totalRatings;
          } else if (user.role === "customer") {
            // Jobs postés
            const { count: postedCount } = await supabase
              .from("jobs")
              .select("*", { count: "exact", head: true })
              .eq("customer_id", user.id);
            jobsPosted = postedCount || 0;

            // Total dépensé
            const { data: paidJobs } = await supabase
              .from("jobs")
              .select("price, fixed_rate, hourly_rate")
              .eq("customer_id", user.id)
              .eq("status", "completed");

            totalSpent =
              paidJobs?.reduce((sum, job) => {
                if (job.fixed_rate) return sum + job.fixed_rate;
                if (job.hourly_rate) return sum + job.hourly_rate * 8;
                return sum + (job.price || 0);
              }, 0) || 0;
          }

          // Vérifier les signalements
          const { count: reports } = await supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("reported_user_id", user.id);
          reportsCount = reports || 0;

          const accountStatus = determineAccountStatus(user);
          const verificationStatus = getVerificationStatus(user);

          return {
            ...user,
            jobs_completed: jobsCompleted,
            jobs_in_progress: jobsInProgress,
            jobs_posted: jobsPosted,
            total_earnings: totalEarnings,
            total_spent: totalSpent,
            rating_stats: ratingStats,
            reviews_count: reviewsCount,
            reports_count: reportsCount,
            account_status: accountStatus,
            verification_status: verificationStatus,
            last_active: user.updated_at || user.created_at,
          };
        })
      );

      setUsers(usersWithStats);
      updateStats(usersWithStats);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const determineAccountStatus = (
    user: User
  ): "active" | "suspended" | "pending" => {
    if (user.metadata?.suspended) return "suspended";
    if (user.metadata?.pending_verification) return "pending";
    return "active";
  };

  const updateStats = (usersData: UserWithStats[]) => {
    setStats({
      total: usersData.length,
      customers: usersData.filter((u) => u.role === "customer").length,
      workers: usersData.filter((u) => u.role === "worker").length,
      admins: usersData.filter((u) => u.role === "admin").length,
      active: usersData.filter((u) => u.account_status === "active").length,
      suspended: usersData.filter((u) => u.account_status === "suspended")
        .length,
      pending: usersData.filter((u) => u.account_status === "pending").length,
      verified: usersData.filter((u) => u.verification_status === "verified")
        .length,
      partial: usersData.filter((u) => u.verification_status === "partial")
        .length,
      unverified: usersData.filter((u) => u.verification_status === "none")
        .length,
    });
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.phone?.toLowerCase().includes(term) ||
          user.company_name?.toLowerCase().includes(term) ||
          user.company_email?.toLowerCase().includes(term) ||
          user.city?.toLowerCase().includes(term) ||
          user.business_city?.toLowerCase().includes(term) ||
          user.trade_category?.toLowerCase().includes(term) ||
          user.skills?.some((skill) => skill.toLowerCase().includes(term))
      );
    }

    if (filters.role !== "all") {
      filtered = filtered.filter((user) => user.role === filters.role);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (user) => user.account_status === filters.status
      );
    }

    if (filters.verification === "verified") {
      filtered = filtered.filter(
        (user) => user.verification_status === "verified"
      );
    } else if (filters.verification === "partial") {
      filtered = filtered.filter(
        (user) => user.verification_status === "partial"
      );
    } else if (filters.verification === "none") {
      filtered = filtered.filter((user) => user.verification_status === "none");
    }

    if (filters.dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(
            (user) => new Date(user.created_at) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(
            (user) => new Date(user.created_at) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(
            (user) => new Date(user.created_at) >= filterDate
          );
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(
            (user) => new Date(user.created_at) >= filterDate
          );
          break;
      }
    }

    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key as keyof UserWithStats];
      let bValue = b[sortConfig.key as keyof UserWithStats];

      if (sortConfig.key === "full_name") {
        aValue = a.full_name || "";
        bValue = b.full_name || "";
      }

      if (sortConfig.key === "rating") {
        aValue = a.rating_stats?.displayedRating || 0;
        bValue = b.rating_stats?.displayedRating || 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;

      return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
    });

    setFilteredUsers(filtered);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
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
        if (
          !confirm(
            "Are you sure you want to delete this user? This action cannot be undone."
          )
        ) {
          return;
        }
        alert(
          "User deletion requires admin privileges. Please use the Supabase dashboard."
        );
        return;
      }

      if (action === "suspend") {
        const { error } = await supabase
          .from("profiles")
          .update({
            metadata: {
              ...users.find((u) => u.id === userId)?.metadata,
              suspended: true,
            },
          })
          .eq("id", userId);
        if (error) throw error;
      }

      if (action === "activate") {
        const { error } = await supabase
          .from("profiles")
          .update({
            metadata: {
              ...users.find((u) => u.id === userId)?.metadata,
              suspended: false,
            },
          })
          .eq("id", userId);
        if (error) throw error;
      }

      if (action === "verify_business") {
        const { error } = await supabase
          .from("profiles")
          .update({ business_verified: true })
          .eq("id", userId);
        if (error) throw error;
      }

      if (action === "verify_insurance") {
        const { error } = await supabase
          .from("profiles")
          .update({ insurance_verified: true })
          .eq("id", userId);
        if (error) throw error;
      }

      if (action === "unverify") {
        const { error } = await supabase
          .from("profiles")
          .update({
            business_verified: false,
            insurance_verified: false,
          })
          .eq("id", userId);
        if (error) throw error;
      }

      await fetchUsers();
      setSelectedUsers([]);
      setSelectAll(false);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Error performing ${action}. Please try again.`);
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

  const exportUsers = () => {
    const data = filteredUsers.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      city: user.city || user.business_city,
      country: user.country || user.business_country,
      company: user.company_name,
      trade_category: user.trade_category,
      skills: user.skills?.join(", "),
      hourly_rate: user.hourly_rate,
      rating: user.rating_stats?.displayedRating || "N/A",
      reviews_count: user.reviews_count || 0,
      business_verified: user.business_verified ? "Yes" : "No",
      insurance_verified: user.insurance_verified ? "Yes" : "No",
      verification_status: user.verification_status,
      loyalty_points: user.loyalty_points,
      jobs_completed: user.jobs_completed || 0,
      jobs_posted: user.jobs_posted || 0,
      total_earnings: user.total_earnings || 0,
      total_spent: user.total_spent || 0,
      created_at: new Date(user.created_at).toLocaleDateString(),
      status: user.account_status,
    }));

    const csv = convertToCSV(data);
    downloadCSV(
      csv,
      `users_export_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((obj) =>
      Object.values(obj)
        .map((value) =>
          typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value
        )
        .join(",")
    );
    return [headers, ...rows].join("\n");
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
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

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            +{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
    </div>
  );

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
            <BadgeCheck className="w-3 h-3" />
            Verified
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            <Shield className="w-3 h-3" />
            Partial
          </span>
        );
      case "none":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            <BadgeX className="w-3 h-3" />
            Unverified
          </span>
        );
      default:
        return null;
    }
  };

  const RatingDisplay = ({ stats }: { stats?: RatingStats }) => {
    if (!stats || stats.totalRatings === 0) {
      return (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-gray-300" />
          <span className="text-sm text-gray-400">No ratings yet</span>
        </div>
      );
    }

    // Cas où le worker a des ratings mais pas assez pour être établi (< 5)
    if (!stats.isEstablished && stats.totalRatings > 0) {
      return (
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">
            {stats.statusText}
          </span>
          <span className="text-xs text-gray-400">
            ({stats.totalRatings} rating{stats.totalRatings !== 1 ? "s" : ""})
          </span>
        </div>
      );
    }

    // Cas où le worker a 5+ ratings
    if (stats.isEstablished && stats.displayedRating) {
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(stats.displayedRating!)
                    ? "fill-amber-500 text-amber-500"
                    : i === Math.floor(stats.displayedRating!) &&
                      stats.displayedRating! % 1 >= 0.5
                    ? "fill-amber-500 text-amber-500 opacity-50"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="font-medium text-sm text-amber-700">
            {stats.displayedRating}
          </span>
          <span className="text-xs text-gray-400">({stats.totalRatings})</span>
        </div>
      );
    }

    // Fallback
    return (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">No rating</span>
      </div>
    );
  };

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage all users on the platform
              </p>
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-red-700 font-medium">
                  {selectedUsers.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction("verify_business")}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Verify Business
                </button>
                <button
                  onClick={() => handleBulkAction("verify_insurance")}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Verify Insurance
                </button>
                <button
                  onClick={() => handleBulkAction("suspend")}
                  className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                  Suspend
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className=" space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              title="Total Users"
              value={stats.total}
              icon={Users}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Active"
              value={stats.active}
              icon={UserCheck}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title="Suspended"
              value={stats.suspended}
              icon={UserX}
              color="bg-red-100 text-red-600"
            />
            <StatCard
              title="Workers"
              value={stats.workers}
              icon={Briefcase}
              color="bg-purple-100 text-purple-600"
            />
            <StatCard
              title="Customers"
              value={stats.customers}
              icon={Users}
              color="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              title="Verified"
              value={stats.verified}
              icon={BadgeCheck}
              color="bg-emerald-100 text-emerald-600"
            />
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, company, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition ${
                    showFilters ||
                    Object.values(filters).some((v) => v !== "all")
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {Object.values(filters).filter((v) => v !== "all").length >
                    0 && (
                    <span className="w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                      {Object.values(filters).filter((v) => v !== "all").length}
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
                <button
                  onClick={exportUsers}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  title="Export to CSV"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Role
                    </label>
                    <select
                      value={filters.role}
                      onChange={(e) =>
                        setFilters({ ...filters, role: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="all">All Roles</option>
                      <option value="customer">Customers</option>
                      <option value="worker">Workers</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Verification
                    </label>
                    <select
                      value={filters.verification}
                      onChange={(e) =>
                        setFilters({ ...filters, verification: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="all">All</option>
                      <option value="verified">Fully Verified</option>
                      <option value="partial">Partially Verified</option>
                      <option value="none">Unverified</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Joined
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) =>
                        setFilters({ ...filters, dateRange: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 days</option>
                      <option value="month">Last 30 days</option>
                      <option value="year">Last year</option>
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
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort("full_name")}
                    >
                      <div className="flex items-center gap-1">
                        User
                        {sortConfig.key === "full_name" && (
                          <span>
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort("role")}
                    >
                      <div className="flex items-center gap-1">
                        Role
                        {sortConfig.key === "role" && (
                          <span>
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort("jobs_completed")}
                    >
                      <div className="flex items-center gap-1">
                        Stats
                        {sortConfig.key === "jobs_completed" && (
                          <span>
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort("rating")}
                    >
                      <div className="flex items-center gap-1">
                        Rating
                        {sortConfig.key === "rating" && (
                          <span>
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center gap-1">
                        Joined
                        {sortConfig.key === "created_at" && (
                          <span>
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${getAvatarColor(
                              user.id
                            )} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
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
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {user.full_name || "No name"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                            {user.company_name && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <Building className="w-3 h-3" />
                                {user.company_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium inline-block w-fit ${
                              user.role === "admin"
                                ? "bg-red-100 text-red-800"
                                : user.role === "worker"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.role}
                          </span>
                          {user.trade_category && (
                            <span className="text-xs text-gray-500">
                              {user.trade_category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {user.phone && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </p>
                          )}
                          {user.city && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {user.city}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getVerificationBadge(user.verification_status)}
                        {user.business_verified && user.insurance_verified && (
                          <div className="mt-1 space-y-1">
                            {user.business_verified && (
                              <span className="text-xs text-emerald-600 flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3" />
                                Business
                              </span>
                            )}
                            {user.insurance_verified && (
                              <span className="text-xs text-blue-600 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Insurance
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "worker" && (
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">
                                {user.jobs_completed || 0}
                              </span>
                              <span className="text-gray-500 ml-1">jobs</span>
                            </p>
                            {user.hourly_rate && (
                              <p className="text-xs text-gray-600">
                                ${user.hourly_rate}/{user.rate_type || "hr"}
                              </p>
                            )}
                            {user.total_earnings ? (
                              <p className="text-xs text-green-600 font-medium">
                                Earned: {formatCurrency(user.total_earnings)}
                              </p>
                            ) : null}
                          </div>
                        )}
                        {user.role === "customer" && (
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">
                                {user.jobs_posted || 0}
                              </span>
                              <span className="text-gray-500 ml-1">posted</span>
                            </p>
                            {user.total_spent ? (
                              <p className="text-xs text-blue-600 font-medium">
                                Spent: {formatCurrency(user.total_spent)}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "worker" ? (
                          <RatingDisplay stats={user.rating_stats} />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            {formatDate(user.created_at)}
                          </p>
                          {user.last_active && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last active: {formatDate(user.last_active)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium inline-block w-fit ${
                              user.account_status === "active"
                                ? "bg-green-100 text-green-800"
                                : user.account_status === "suspended"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {user.account_status}
                          </span>
                          {user.reports_count ? (
                            <span className="text-xs text-red-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {user.reports_count} reports
                            </span>
                          ) : null}
                        </div>
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
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border hidden group-hover:block z-20">
                              <div className="py-1">
                                <Link
                                  href={`/admin/users/${user.id}/edit`}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit className="w-4 h-4 inline mr-2" />
                                  Edit User
                                </Link>

                                {user.account_status === "active" ? (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(user.id, "suspend")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                                  >
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    Suspend Account
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(user.id, "activate")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                                  >
                                    <Unlock className="w-4 h-4 inline mr-2" />
                                    Activate Account
                                  </button>
                                )}

                                {!user.business_verified && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(
                                        user.id,
                                        "verify_business"
                                      )
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                                  >
                                    <BadgeCheck className="w-4 h-4 inline mr-2" />
                                    Verify Business
                                  </button>
                                )}

                                {!user.insurance_verified && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(
                                        user.id,
                                        "verify_insurance"
                                      )
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                  >
                                    <Shield className="w-4 h-4 inline mr-2" />
                                    Verify Insurance
                                  </button>
                                )}

                                {(user.business_verified ||
                                  user.insurance_verified) && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(user.id, "unverify")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                                  >
                                    <XCircle className="w-4 h-4 inline mr-2" />
                                    Remove Verification
                                  </button>
                                )}

                                <hr className="my-1 border-gray-200" />

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
                        )} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
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
                    <div className="flex flex-col items-end gap-1">
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
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.account_status === "active"
                            ? "bg-green-100 text-green-800"
                            : user.account_status === "suspended"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {user.account_status}
                      </span>
                    </div>
                  </div>

                  <div className="ml-14 space-y-3">
                    {/* Verification */}
                    <div className="flex items-center gap-2">
                      {getVerificationBadge(user.verification_status)}
                    </div>

                    {/* Rating for workers */}
                    {user.role === "worker" && (
                      <div className="flex items-center gap-2">
                        <RatingDisplay stats={user.rating_stats} />
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {user.phone && (
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Phone
                          </span>
                          <span className="text-xs text-gray-900 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </span>
                        </div>
                      )}
                      {user.city && (
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Location
                          </span>
                          <span className="text-xs text-gray-900 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {user.city}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-lg">
                      {user.role === "worker" ? (
                        <>
                          <div>
                            <span className="text-xs text-gray-500 block">
                              Jobs
                            </span>
                            <span className="text-sm font-medium">
                              {user.jobs_completed || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">
                              Reviews
                            </span>
                            <span className="text-sm font-medium">
                              {user.reviews_count || 0}
                            </span>
                          </div>
                          {user.hourly_rate && (
                            <div className="col-span-2">
                              <span className="text-xs text-gray-500 block">
                                Rate
                              </span>
                              <span className="text-sm font-medium">
                                ${user.hourly_rate}/{user.rate_type || "hr"}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-xs text-gray-500 block">
                              Jobs Posted
                            </span>
                            <span className="text-sm font-medium">
                              {user.jobs_posted || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">
                              Spent
                            </span>
                            <span className="text-sm font-medium">
                              {formatCurrency(user.total_spent)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Company Info */}
                    {user.company_name && (
                      <div className="text-xs text-gray-600">
                        <p className="font-medium">{user.company_name}</p>
                        {user.trade_category && (
                          <p className="text-gray-500">{user.trade_category}</p>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Joined {formatDate(user.created_at)}</span>
                      {user.reports_count ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {user.reports_count} reports
                        </span>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition text-center"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        className="px-3 py-2 border border-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition"
                      >
                        Edit
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
                  {searchTerm || Object.values(filters).some((v) => v !== "all")
                    ? "Try adjusting your filters"
                    : "No users have been created yet"}
                </p>
                {(searchTerm ||
                  Object.values(filters).some((v) => v !== "all")) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilters({
                        role: "all",
                        status: "all",
                        verification: "all",
                        dateRange: "all",
                      });
                    }}
                    className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
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
