"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Edit,
  Trash2,
  MessageSquare,
  Clock,
  DollarSign,
  Building2,
  Award,
  Wrench,
  Landmark,
  FileText,
  Home,
  CreditCard,
  Download,
} from "lucide-react";

type WorkExperience = {
  id: string;
  worker_id: string;
  company_name: string;
  location: string | null;
  position: string;
  employment_type: "full-time" | "part-time" | "contract" | "internship";
  start_date: string;
  end_date: string | null;
  current: boolean;
  description: string | null;
  created_at: string;
};

type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "customer" | "worker" | "admin";
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  created_at: string;

  // Professional Details (Worker only)
  job_title: string | null;
  trade_category: string | null;
  level: string | null;
  skills: string[] | null;

  // Payment Preferences (Worker only)
  rate_type: "hourly" | "fixed" | "project" | null;
  hourly_rate: number | null;

  // Bank Account (Worker only)
  bank_name: string | null;
  bank_account_holder: string | null;
  bank_account_number: string | null;
  bank_routing_number: string | null;

  // Insurance (Worker only)
  insurance_url: string | null;
  insurance_verified: boolean;

  work_experience?: WorkExperience[];
};

type UserStats = {
  jobs_completed: number;
  jobs_posted: number;
  rating: number | null;
  total_earned: number;
  total_spent: number;
};

type Job = {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
};

export default function AdminUserDetailPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [stats, setStats] = useState<UserStats>({
    jobs_completed: 0,
    jobs_posted: 0,
    rating: null,
    total_earned: 0,
    total_spent: 0,
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "professional"
    | "payment"
    | "insurance"
    | "experience"
    | "jobs"
  >("overview");
  const params = useParams();
  const router = useRouter();

  const userId = params?.id as string;

  useEffect(() => {
    if (!userId || userId === "undefined" || userId === "null") {
      setError("User ID is missing or invalid");
      setLoading(false);
      return;
    }

    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer les infos de base de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("User fetch error:", userError);
        if (userError.code === "PGRST116") {
          setError("User not found");
        } else {
          throw userError;
        }
        return;
      }

      setUser(userData);

      // 2. Si c'est un worker, récupérer l'expérience professionnelle
      if (userData.role === "worker") {
        const { data: expData, error: expError } = await supabase
          .from("work_experience")
          .select("*")
          .eq("worker_id", userId)
          .order("start_date", { ascending: false });

        if (!expError && expData) {
          setWorkExperience(expData);
        }
      }

      // 3. Récupérer les statistiques selon le rôle
      if (userData.role === "worker") {
        // Jobs complétés
        const { data: completedJobs, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title, price, status, created_at")
          .eq("worker_id", userId)
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (!jobsError && completedJobs) {
          setStats((prev) => ({
            ...prev,
            jobs_completed: completedJobs.length,
            total_earned: completedJobs.reduce(
              (sum, job) => sum + (job.price || 0),
              0
            ),
          }));
          setRecentJobs(completedJobs.slice(0, 5));
        }
      } else if (userData.role === "customer") {
        // Jobs postés
        const { data: postedJobs, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title, price, status, created_at")
          .eq("customer_id", userId)
          .order("created_at", { ascending: false });

        if (!jobsError && postedJobs) {
          setStats((prev) => ({
            ...prev,
            jobs_posted: postedJobs.length,
            total_spent: postedJobs.reduce(
              (sum, job) => sum + (job.price || 0),
              0
            ),
          }));
          setRecentJobs(postedJobs.slice(0, 5));
        }
      }
    } catch (err: any) {
      console.error("Error fetching user details:", err);
      setError(err.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatEmploymentType = (type: string) => {
    switch (type) {
      case "full-time":
        return "Full Time";
      case "part-time":
        return "Part Time";
      case "contract":
        return "Contract";
      case "internship":
        return "Internship";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full p-6 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error || "User Not Found"}
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            {error || "The user you're looking for doesn't exist."}
          </p>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link
              href="/admin/users"
              className="hover:text-gray-700 transition"
            >
              Users
            </Link>
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span className="text-gray-900 font-medium">
              {user.full_name || "User Details"}
            </span>
          </div>

          {/* Title and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full ${getAvatarColor(
                  user.id
                )} flex items-center justify-center text-white font-bold text-lg`}
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.full_name || "No name"}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                  {user.phone && (
                    <>
                      <span className="text-gray-300">|</span>
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </>
                  )}
                </div>
                {user.address && user.city && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {user.address}, {user.city}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === "admin"
                    ? "bg-red-100 text-red-800"
                    : user.role === "worker"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                <Shield className="w-3 h-3" />
                {user.role}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                activeTab === "overview"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Overview
            </button>
            {user.role === "worker" && (
              <>
                <button
                  onClick={() => setActiveTab("professional")}
                  className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                    activeTab === "professional"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  Professional
                </button>
                <button
                  onClick={() => setActiveTab("payment")}
                  className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                    activeTab === "payment"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  Payment
                </button>
                <button
                  onClick={() => setActiveTab("insurance")}
                  className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                    activeTab === "insurance"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  Insurance
                </button>
                <button
                  onClick={() => setActiveTab("experience")}
                  className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                    activeTab === "experience"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  Experience
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                activeTab === "jobs"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {user.role === "worker" ? "Jobs" : "Posted Jobs"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {user.role === "worker" ? (
                    <>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <Briefcase className="w-8 h-8 text-purple-600 mb-3" />
                        <p className="text-3xl font-bold text-gray-900">
                          {stats.jobs_completed}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Jobs Completed
                        </p>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                        <p className="text-3xl font-bold text-gray-900">
                          ${stats.total_earned}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Total Earned
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <Briefcase className="w-8 h-8 text-green-600 mb-3" />
                        <p className="text-3xl font-bold text-gray-900">
                          {stats.jobs_posted}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Jobs Posted
                        </p>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <DollarSign className="w-8 h-8 text-blue-600 mb-3" />
                        <p className="text-3xl font-bold text-gray-900">
                          ${stats.total_spent}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Total Spent
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Recent Jobs */}
                {recentJobs.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent{" "}
                      {user.role === "worker"
                        ? "Completed Jobs"
                        : "Posted Jobs"}
                    </h3>
                    <div className="space-y-3">
                      {recentJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {job.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(job.created_at)}
                            </p>
                          </div>
                          <span className="font-semibold text-gray-900">
                            ${job.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Member since
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">User ID</span>
                      <span className="text-sm font-medium text-gray-900 font-mono">
                        {user.id.slice(0, 8)}...
                      </span>
                    </div>
                    {user.role === "worker" && user.job_title && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Job Title</span>
                        <span className="text-sm font-medium text-gray-900">
                          {user.job_title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Actions
                  </h3>
                  <div className="space-y-2">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit User
                    </Link>
                    <Link
                      href={`/admin/messages?user=${user.id}`}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Professional Tab (Worker only) */}
          {activeTab === "professional" && user.role === "worker" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Professional Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Job Title</p>
                    <p className="font-medium text-gray-900">
                      {user.job_title || "Not specified"}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Trade Category</p>
                    <p className="font-medium text-gray-900">
                      {user.trade_category || "Not specified"}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Level</p>
                    <p className="font-medium text-gray-900">
                      {user.level || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Skills</p>
                    {user.skills && user.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No skills listed</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Tab (Worker only) */}
          {activeTab === "payment" && user.role === "worker" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Payment Preferences
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Rate Type</p>
                  <p className="font-medium text-gray-900">
                    {user.rate_type
                      ? user.rate_type.charAt(0).toUpperCase() +
                        user.rate_type.slice(1)
                      : "Not specified"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Hourly Rate</p>
                  <p className="font-medium text-gray-900">
                    {user.hourly_rate
                      ? `$${user.hourly_rate}/hr`
                      : "Not specified"}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
                Bank Account Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                  <p className="font-medium text-gray-900">
                    {user.bank_name || "Not specified"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Account Holder</p>
                  <p className="font-medium text-gray-900">
                    {user.bank_account_holder || "Not specified"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Account Number</p>
                  <p className="font-medium text-gray-900">
                    {user.bank_account_number
                      ? `•••• ${user.bank_account_number.slice(-4)}`
                      : "Not specified"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Routing Number</p>
                  <p className="font-medium text-gray-900">
                    {user.bank_routing_number || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Insurance Tab (Worker only) */}
          {activeTab === "insurance" && user.role === "worker" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Insurance
              </h3>

              <div className="p-6 bg-gray-50 rounded-lg">
                {user.insurance_url ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-700">
                        Insurance document uploaded
                      </span>
                      {user.insurance_verified ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Verification
                        </span>
                      )}
                    </div>

                    <a
                      href={user.insurance_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <FileText className="w-4 h-4" />
                      View Document
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No insurance document uploaded
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Experience Tab (Worker only) */}
          {activeTab === "experience" && user.role === "worker" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Work Experience
              </h3>

              {workExperience.length > 0 ? (
                <div className="space-y-4">
                  {workExperience.map((exp) => (
                    <div key={exp.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {exp.position}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {exp.company_name}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatEmploymentType(exp.employment_type)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-2">
                        {exp.location || "Location not specified"}
                      </p>

                      <p className="text-xs text-gray-500 mb-3">
                        {formatDate(exp.start_date)} -{" "}
                        {exp.current
                          ? "Present"
                          : exp.end_date
                          ? formatDate(exp.end_date)
                          : ""}
                      </p>

                      {exp.description && (
                        <p className="text-sm text-gray-700 mt-2">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No work experience added
                </p>
              )}
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === "jobs" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {user.role === "worker" ? "Completed Jobs" : "Posted Jobs"}
              </h3>
              {recentJobs.length > 0 ? (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(job.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-900">
                          ${job.price}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : job.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No jobs found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
