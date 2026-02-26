"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Users,
  Briefcase,
  CreditCard,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DashboardStats = {
  totalUsers: number;
  totalWorkers: number;
  totalCustomers: number;
  newUsersToday: number;
  newUsersWeek: number;
  newUsersMonth: number;
  totalJobs: number;
  openJobs: number;
  assignedJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  totalRevenue: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  platformFee: number;
  pendingPayouts: number;
  averageJobPrice: number;
};

type RecentActivity = {
  id: string;
  type: "user" | "job" | "application" | "payment";
  action: string;
  user: string;
  user_id: string;
  timestamp: string;
  status: "success" | "warning" | "danger";
  link?: string;
};

type ChartData = {
  name: string;
  value: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalWorkers: 0,
    totalCustomers: 0,
    newUsersToday: 0,
    newUsersWeek: 0,
    newUsersMonth: 0,
    totalJobs: 0,
    openJobs: 0,
    assignedJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    totalRevenue: 0,
    revenueToday: 0,
    revenueWeek: 0,
    revenueMonth: 0,
    platformFee: 0,
    pendingPayouts: 0,
    averageJobPrice: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<ChartData[]>([]);
  const [userChartData, setUserChartData] = useState<ChartData[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer les statistiques utilisateurs
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: totalWorkers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "worker");

      const { count: totalCustomers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "customer");

      // Nouveaux utilisateurs
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const monthAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { count: newUsersToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      const { count: newUsersWeek } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo);

      const { count: newUsersMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthAgo);

      // 2. Récupérer les statistiques des jobs
      const { count: totalJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true });

      const { count: openJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      const { count: assignedJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "assigned");

      const { count: inProgressJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_progress");

      const { count: completedJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      const { count: cancelledJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "cancelled");

      // Prix moyen des jobs
      const { data: jobsData } = await supabase.from("jobs").select("price");

      const averageJobPrice =
        jobsData && jobsData.length > 0
          ? jobsData.reduce((sum, job) => sum + (job.price || 0), 0) /
            jobsData.length
          : 0;

      // 3. Récupérer les statistiques des applications
      const { count: totalApplications } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true });

      const { count: pendingApplications } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: acceptedApplications } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted");

      const { count: rejectedApplications } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected");

      // 4. Récupérer les données de revenus (à partir des jobs complétés)
      const { data: completedJobsData } = await supabase
        .from("jobs")
        .select("price, created_at")
        .eq("status", "completed");

      const totalRevenue =
        completedJobsData?.reduce((sum, job) => sum + (job.price || 0), 0) || 0;
      const platformFee = Math.round(totalRevenue * 0.1); // 10% de commission

      // Revenus aujourd'hui
      const todayRevenue =
        completedJobsData
          ?.filter((job) => job.created_at?.startsWith(today))
          .reduce((sum, job) => sum + (job.price || 0), 0) || 0;

      // Revenus cette semaine
      const weekRevenue =
        completedJobsData
          ?.filter((job) => job.created_at >= weekAgo)
          .reduce((sum, job) => sum + (job.price || 0), 0) || 0;

      // Revenus ce mois
      const monthRevenue =
        completedJobsData
          ?.filter((job) => job.created_at >= monthAgo)
          .reduce((sum, job) => sum + (job.price || 0), 0) || 0;

      // Paiements en attente (jobs assignés ou en cours)
      const { data: pendingJobs } = await supabase
        .from("jobs")
        .select("price")
        .in("status", ["assigned", "in_progress"]);

      const pendingPayouts =
        pendingJobs?.reduce((sum, job) => sum + (job.price || 0), 0) || 0;

      // Taux de complétion

      setStats({
        totalUsers: totalUsers || 0,
        totalWorkers: totalWorkers || 0,
        totalCustomers: totalCustomers || 0,
        newUsersToday: newUsersToday || 0,
        newUsersWeek: newUsersWeek || 0,
        newUsersMonth: newUsersMonth || 0,
        totalJobs: totalJobs || 0,
        openJobs: openJobs || 0,
        assignedJobs: assignedJobs || 0,
        inProgressJobs: inProgressJobs || 0,
        completedJobs: completedJobs || 0,
        cancelledJobs: cancelledJobs || 0,
        totalApplications: totalApplications || 0,
        pendingApplications: pendingApplications || 0,
        acceptedApplications: acceptedApplications || 0,
        rejectedApplications: rejectedApplications || 0,
        totalRevenue,
        revenueToday: todayRevenue,
        revenueWeek: weekRevenue,
        revenueMonth: monthRevenue,
        platformFee,
        pendingPayouts,
        averageJobPrice,

        //ts-ignore
      });

      // 5. Générer les données pour les graphiques
      await generateChartData();

      // 6. Récupérer les activités récentes
      await fetchRecentActivity();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = async () => {
    try {
      // Données de revenus pour les 7 derniers jours
      const revenueData: ChartData[] = [];
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];

        const { data: dayJobs } = await supabase
          .from("jobs")
          .select("price")
          .eq("status", "completed")
          .gte("created_at", `${dateStr}T00:00:00`)
          .lt("created_at", `${dateStr}T23:59:59`);

        const revenue =
          dayJobs?.reduce((sum, job) => sum + (job.price || 0), 0) || 0;
        revenueData.push({ name: dayName, value: revenue });
      }
      setRevenueChartData(revenueData);

      // Croissance des utilisateurs (par semaine)
      const userData: ChartData[] = [];
      for (let i = 4; i >= 1; i--) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - i * 7);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (i - 1) * 7);

        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString());

        userData.push({ name: `Week ${4 - i + 1}`, value: count || 0 });
      }
      setUserChartData(userData);

      // Jobs par catégorie
      const { data: categoryData } = await supabase
        .from("jobs")
        .select("category");

      const categoryCount: { [key: string]: number } = {};
      categoryData?.forEach((job) => {
        if (job.category) {
          categoryCount[job.category] = (categoryCount[job.category] || 0) + 1;
        }
      });

      const categoryChart = Object.entries(categoryCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);

      setCategoryChartData(categoryChart);
    } catch (error) {
      console.error("Error generating chart data:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const activities: RecentActivity[] = [];

      // Derniers utilisateurs inscrits
      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(2);

      recentUsers?.forEach((user) => {
        activities.push({
          id: `user-${user.id}`,
          type: "user",
          action: `New ${user.role} registered`,
          user: user.full_name || user.email,
          user_id: user.id,
          timestamp: new Date(user.created_at).toLocaleDateString(),
          status: "success",
          link: `/admin/users/${user.id}`,
        });
      });

      // Derniers jobs signalés
      const { data: reportedJobs } = await supabase
        .from("jobs")
        .select("id, title, customer_id, created_at")
        .eq("status", "reported")
        .order("created_at", { ascending: false })
        .limit(2);

      reportedJobs?.forEach((job) => {
        activities.push({
          id: `job-${job.id}`,
          type: "job",
          action: "Job reported",
          user: `Job #${job.id.slice(0, 8)}`,
          user_id: job.customer_id,
          timestamp: new Date(job.created_at).toLocaleDateString(),
          status: "warning",
          link: `/admin/jobs/${job.id}`,
        });
      });

      // Derniers paiements importants
      const { data: recentPayments } = await supabase
        .from("jobs")
        .select("id, title, price, worker_id, created_at")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(2);

      recentPayments?.forEach((payment) => {
        activities.push({
          id: `payment-${payment.id}`,
          type: "payment",
          action: `Payment of $${payment.price} processed`,
          user: `Job: ${payment.title}`,
          user_id: payment.worker_id || "",
          timestamp: new Date(payment.created_at).toLocaleDateString(),
          status: "success",
          link: `/admin/jobs/${payment.id}`,
        });
      });

      // Dernières candidatures
      const { data: recentApplications } = await supabase
        .from("applications")
        .select("id, job_id, worker_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(2);

      recentApplications?.forEach((app) => {
        activities.push({
          id: `app-${app.id}`,
          type: "application",
          action: `Application ${app.status}`,
          user: `Worker ${app.worker_id.slice(0, 8)}`,
          user_id: app.worker_id,
          timestamp: new Date(app.created_at).toLocaleDateString(),
          status:
            app.status === "pending"
              ? "warning"
              : app.status === "accepted"
              ? "success"
              : "danger",
          link: `/admin/applications/${app.id}`,
        });
      });

      // Trier par date (les plus récents d'abord)
      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeType,
    color,
    prefix = "",
    suffix = "",
  }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm ${
              changeType === "positive" ? "text-green-600" : "text-red-600"
            }`}
          >
            {changeType === "positive" ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix}
      </p>
    </div>
  );

  const COLORS = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, Admin. Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last 12 months</option>
          </select>
          <button
            onClick={fetchDashboardData}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          change={(stats.newUsersToday / stats.totalUsers) * 100 || 0}
          changeType="positive"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon={Briefcase}
          change={(stats.openJobs / stats.totalJobs) * 100 || 0}
          changeType={stats.openJobs > 0 ? "positive" : "negative"}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Revenue"
          value={stats.totalRevenue}
          icon={DollarSign}
          prefix="$"
          change={(stats.revenueToday / stats.totalRevenue) * 100 || 0}
          changeType="positive"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Pending Payouts"
          value={stats.pendingPayouts}
          icon={AlertTriangle}
          prefix="$"
          change={(stats.pendingPayouts / stats.totalRevenue) * 100 || 0}
          changeType="negative"
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Workers"
          value={stats.totalWorkers}
          icon={Users}
          color="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={Users}
          color="bg-cyan-100 text-cyan-600"
        />
        <StatCard
          title="Avg Job Price"
          value={stats.averageJobPrice}
          icon={DollarSign}
          prefix="$"
          color="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Revenue Overview
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>This week</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip formatter={(value) => `$${value}`} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">User Growth</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>+{stats.newUsersToday} today</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Jobs by Category
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => {
                    const safePercent = percent ?? 0;
                    return `${name} ${(safePercent * 100).toFixed(0)}%`;
                  }}
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryChartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-sm text-gray-600 truncate">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Job Status
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Open</span>
              <span className="font-semibold">{stats.openJobs}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: `${(stats.openJobs / stats.totalJobs) * 100}%`,
                }}
              />
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">Assigned</span>
              <span className="font-semibold">{stats.assignedJobs}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${(stats.assignedJobs / stats.totalJobs) * 100}%`,
                }}
              />
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="font-semibold">{stats.inProgressJobs}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{
                  width: `${(stats.inProgressJobs / stats.totalJobs) * 100}%`,
                }}
              />
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold">{stats.completedJobs}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{
                  width: `${(stats.completedJobs / stats.totalJobs) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Recent Activity
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.link || "#"}
                  className="flex items-start gap-3 hover:bg-gray-50 p-2 rounded-lg transition"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.status === "success"
                        ? "bg-green-100"
                        : activity.status === "warning"
                        ? "bg-yellow-100"
                        : "bg-red-100"
                    }`}
                  >
                    {activity.type === "user" && (
                      <Users
                        className={`w-4 h-4 ${
                          activity.status === "success"
                            ? "text-green-600"
                            : activity.status === "warning"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      />
                    )}
                    {activity.type === "job" && (
                      <Briefcase
                        className={`w-4 h-4 ${
                          activity.status === "success"
                            ? "text-green-600"
                            : activity.status === "warning"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      />
                    )}
                    {activity.type === "payment" && (
                      <CreditCard
                        className={`w-4 h-4 ${
                          activity.status === "success"
                            ? "text-green-600"
                            : activity.status === "warning"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      />
                    )}
                    {activity.type === "application" && (
                      <Briefcase
                        className={`w-4 h-4 ${
                          activity.status === "success"
                            ? "text-green-600"
                            : activity.status === "warning"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.user} · {activity.timestamp}
                    </p>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </Link>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No recent activity
              </p>
            )}
          </div>
          <Link
            href="/admin/reports"
            className="block text-center text-sm text-red-600 hover:text-red-700 font-medium mt-6"
          >
            View all activity
          </Link>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            ${stats.revenueToday.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">This Week</p>
          <p className="text-2xl font-bold text-gray-900">
            ${stats.revenueWeek.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">This Month</p>
          <p className="text-2xl font-bold text-gray-900">
            ${stats.revenueMonth.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
