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
  BadgeCheck,
  Ban,
  RotateCcw,
  ThumbsUp,
  Users,
  TrendingUp,
} from "lucide-react";
import { Job } from "@/types/job";

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

type RatingStats = {
  averageRating: number | null;
  displayedRating: number | null;
  totalRatings: number;
  isEstablished: boolean;
  statusText: string;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentRatings: Array<{
    id: string;
    rating: number;
    review_text: string | null;
    created_at: string;
    reviewer_name: string;
    reviewer_avatar?: string;
    job_title?: string;
  }>;
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
  updated_at?: string;

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

  // Business Verification
  business_verified?: boolean;

  work_experience?: WorkExperience[];
};

type UserStats = {
  jobs_completed: number;
  jobs_posted: number;
  rating_stats: RatingStats | null;
  total_earned: number;
  total_spent: number;
};

// Fonction pour calculer les statistiques de rating selon la formule
const calculateRatingStats = (
  ratings: {
    rating: number;
    review_text: string | null;
    created_at: string;
    reviewer_id: string;
    job_id: string;
  }[]
): RatingStats => {
  const totalRatings = ratings.length;
  const ratingValues = ratings.map((r) => r.rating);

  // Distribution des notes
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingValues.forEach((r) => {
    if (r >= 1 && r <= 5) {
      distribution[r as keyof typeof distribution]++;
    }
  });

  if (totalRatings === 0) {
    return {
      averageRating: null,
      displayedRating: null,
      totalRatings: 0,
      isEstablished: false,
      statusText: "No ratings",
      ratingDistribution: distribution,
      recentRatings: [],
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
      const sortedRatings = [...ratingValues].sort((a, b) => a - b);
      const ratingsWithoutLowest = sortedRatings.slice(1);
      const sum = ratingsWithoutLowest.reduce((acc, r) => acc + r, 0);
      averageRating = sum / ratingsWithoutLowest.length;
      displayedRating = parseFloat(averageRating.toFixed(1));
      statusText = "Established";
    } else {
      // Moyenne arithmétique simple
      const sum = ratingValues.reduce((acc, r) => acc + r, 0);
      averageRating = sum / totalRatings;
      displayedRating = parseFloat(averageRating.toFixed(1));
      statusText = "Established";
    }
  } else {
    const sum = ratingValues.reduce((acc, r) => acc + r, 0);
    averageRating = sum / totalRatings;
    displayedRating = null;
    statusText = totalRatings === 1 ? "New" : "Establishing";
  }

  return {
    averageRating,
    displayedRating,
    totalRatings,
    isEstablished,
    statusText,
    ratingDistribution: distribution,
    recentRatings: [], // Sera rempli après avoir récupéré les infos des reviewers
  };
};

export default function AdminUserDetailPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [stats, setStats] = useState<UserStats>({
    jobs_completed: 0,
    jobs_posted: 0,
    rating_stats: null,
    total_earned: 0,
    total_spent: 0,
  });
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Fonction pour formater le prix d'un job
  const formatJobPrice = (job: Job) => {
    if (!job) return "$0";

    switch (job.pay_type) {
      case "Fixed":
        return job.fixed_rate
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(job.fixed_rate)
          : "$0";

      case "Range":
        if (job.min_rate && job.max_rate) {
          return `${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          }).format(job.min_rate)} - ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          }).format(job.max_rate)}`;
        }
        return "$0";

      case "Hourly":
        return job.hourly_rate
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            }).format(job.hourly_rate) + "/hr"
          : "$0";

      default:
        return job.price
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            }).format(job.price)
          : "$0";
    }
  };

  // Fonction pour récupérer les ratings du worker
  const fetchWorkerRatings = async (workerId: string) => {
    if (!workerId) return;

    setLoadingRatings(true);
    try {
      // Récupérer tous les ratings du worker
      const { data: ratings, error } = await supabase
        .from("rates")
        .select(
          `
          id,
          rating,
          review_text,
          created_at,
          reviewer_id,
          job_id
        `
        )
        .eq("reviewee_id", workerId)
        .eq("category", "worker")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!ratings || ratings.length === 0) {
        setStats((prev) => ({
          ...prev,
          rating_stats: calculateRatingStats([]),
        }));
        return;
      }

      // Récupérer les infos des reviewers
      const reviewerIds = [...new Set(ratings.map((r) => r.reviewer_id))];
      let reviewersMap = new Map();

      if (reviewerIds.length > 0) {
        const { data: reviewers } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", reviewerIds);

        reviewers?.forEach((r) => {
          reviewersMap.set(r.id, { name: r.full_name, avatar: r.avatar_url });
        });
      }

      // Récupérer les titres des jobs
      const jobIds = [...new Set(ratings.map((r) => r.job_id))];
      let jobsMap = new Map();

      if (jobIds.length > 0) {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title")
          .in("id", jobIds);

        jobs?.forEach((j) => {
          jobsMap.set(j.id, j.title);
        });
      }

      // Calculer les statistiques
      const calculatedStats = calculateRatingStats(ratings);

      // Ajouter les détails des reviews récentes
      const recentRatings = ratings.slice(0, 5).map((r) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.review_text,
        created_at: r.created_at,
        reviewer_name: reviewersMap.get(r.reviewer_id)?.name || "Anonymous",
        reviewer_avatar: reviewersMap.get(r.reviewer_id)?.avatar,
        job_title: jobsMap.get(r.job_id) || "Job",
      }));

      setStats((prev) => ({
        ...prev,
        rating_stats: {
          ...calculatedStats,
          recentRatings,
        },
      }));
    } catch (error) {
      console.error("Error fetching worker ratings:", error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
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
    | "verification"
    | "ratings"
  >("overview");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

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

        // Récupérer les ratings du worker
        await fetchWorkerRatings(userId);
      }

      // 3. Récupérer les statistiques selon le rôle
      if (userData.role === "worker") {
        // Jobs complétés - Récupérer TOUS les champs de prix
        const { data: completedJobs, error: jobsError } = await supabase
          .from("jobs")
          .select(
            `
            id, 
            title, 
            price,
            fixed_rate,
            min_rate,
            max_rate,
            hourly_rate,
            pay_type,
            status, 
            created_at
          `
          )
          .eq("worker_id", userId)
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (!jobsError && completedJobs) {
          // Calculer le total gagné en fonction du type de paiement
          const totalEarned = completedJobs.reduce((sum, job) => {
            if (job.pay_type === "Fixed" && job.fixed_rate) {
              return sum + job.fixed_rate;
            } else if (job.pay_type === "Hourly" && job.hourly_rate) {
              return sum + job.hourly_rate * 8;
            } else if (job.price) {
              return sum + job.price;
            }
            return sum;
          }, 0);

          setStats((prev) => ({
            ...prev,
            jobs_completed: completedJobs.length,
            total_earned: totalEarned,
          }));
          setRecentJobs(
            //@ts-ignore
            completedJobs.slice(0, 5)
          );
        }
      } else if (userData.role === "customer") {
        // Jobs postés - Récupérer TOUS les champs de prix
        const { data: postedJobs, error: jobsError } = await supabase
          .from("jobs")
          .select(
            `
            id, 
            title, 
            price,
            fixed_rate,
            min_rate,
            max_rate,
            hourly_rate,
            pay_type,
            status, 
            created_at
          `
          )
          .eq("customer_id", userId)
          .order("created_at", { ascending: false });

        if (!jobsError && postedJobs) {
          const totalSpent = postedJobs.reduce((sum, job) => {
            if (job.pay_type === "Fixed" && job.fixed_rate) {
              return sum + job.fixed_rate;
            } else if (job.pay_type === "Hourly" && job.hourly_rate) {
              return sum + job.hourly_rate * 8;
            } else if (job.price) {
              return sum + job.price;
            }
            return sum;
          }, 0);

          setStats((prev) => ({
            ...prev,
            jobs_posted: postedJobs.length,
            total_spent: totalSpent,
          }));
          setRecentJobs(
            //@ts-ignore
            postedJobs.slice(0, 5)
          );
        }
      }
    } catch (err: any) {
      console.error("Error fetching user details:", err);
      setError(err.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWorker = async () => {
    if (!user || user.role !== "worker") return;

    try {
      setVerificationLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          business_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setUser({
        ...user,
        business_verified: true,
        updated_at: new Date().toISOString(),
      });

      setShowVerificationModal(false);
      alert("Worker has been successfully verified!");
    } catch (error) {
      console.error("Error verifying worker:", error);
      alert("Failed to verify worker. Please try again.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleUnverifyWorker = async () => {
    if (!user || user.role !== "worker") return;

    if (
      !confirm("Are you sure you want to remove verification from this worker?")
    ) {
      return;
    }

    try {
      setVerificationLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          business_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setUser({
        ...user,
        business_verified: false,
        updated_at: new Date().toISOString(),
      });

      alert("Verification has been removed.");
    } catch (error) {
      console.error("Error removing verification:", error);
      alert("Failed to remove verification. Please try again.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyInsurance = async () => {
    if (!user || user.role !== "worker") return;

    try {
      setInsuranceLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          insurance_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setUser({
        ...user,
        insurance_verified: true,
        updated_at: new Date().toISOString(),
      });

      setShowInsuranceModal(false);
      alert("Insurance has been successfully verified!");
    } catch (error) {
      console.error("Error verifying insurance:", error);
      alert("Failed to verify insurance. Please try again.");
    } finally {
      setInsuranceLoading(false);
    }
  };

  const handleUnverifyInsurance = async () => {
    if (!user || user.role !== "worker") return;

    if (
      !confirm(
        "Are you sure you want to remove insurance verification from this worker?"
      )
    ) {
      return;
    }

    try {
      setInsuranceLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          insurance_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setUser({
        ...user,
        insurance_verified: false,
        updated_at: new Date().toISOString(),
      });

      alert("Insurance verification has been removed.");
    } catch (error) {
      console.error("Error removing insurance verification:", error);
      alert("Failed to remove insurance verification. Please try again.");
    } finally {
      setInsuranceLoading(false);
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

  // Composant d'affichage du rating
  const RatingDisplay = ({ stats }: { stats?: RatingStats | null }) => {
    if (!stats || stats.totalRatings === 0) {
      return (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-gray-300" />
          <span className="text-sm text-gray-400">No ratings yet</span>
        </div>
      );
    }

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

    if (stats.isEstablished && stats.displayedRating) {
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(stats.displayedRating!)
                    ? "fill-amber-500 text-amber-500"
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

    return null;
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
      <div className="sticky top-0 z-10 bg-white shadow-sm">
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.full_name || "No name"}
                  </h1>
                  {user.role === "worker" && stats.rating_stats && (
                    <RatingDisplay stats={stats.rating_stats} />
                  )}
                </div>
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

              {user.role === "worker" && (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    user.business_verified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  <BadgeCheck className="w-3 h-3" />
                  {user.business_verified ? "Verified" : "Unverified"}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 overflow-x-auto pb-1">
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
                  onClick={() => setActiveTab("ratings")}
                  className={`px-3 py-2 text-sm font-medium transition border-b-2 flex items-center gap-1 ${
                    activeTab === "ratings"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Ratings
                  {stats.rating_stats &&
                    stats.rating_stats.totalRatings > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {stats.rating_stats.totalRatings}
                      </span>
                    )}
                </button>
                <button
                  onClick={() => setActiveTab("verification")}
                  className={`px-3 py-2 text-sm font-medium transition border-b-2 ${
                    activeTab === "verification"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  Verification
                </button>
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
        <div className="">
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
                            {job.pay_type && (
                              <p className="text-xs text-gray-400 mt-1">
                                {job.pay_type}
                              </p>
                            )}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatJobPrice(job)}
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
                    {user.role === "worker" && stats.rating_stats && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Rating</span>
                        <RatingDisplay stats={stats.rating_stats} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ratings Tab (Worker only) */}
          {activeTab === "ratings" && user.role === "worker" && (
            <div className="space-y-6">
              {loadingRatings ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading ratings...</p>
                </div>
              ) : stats.rating_stats && stats.rating_stats.totalRatings > 0 ? (
                <>
                  {/* Rating Summary Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left - Overall Rating */}
                      <div className="text-center">
                        {stats.rating_stats.isEstablished &&
                        stats.rating_stats.displayedRating ? (
                          <>
                            <div className="text-5xl font-bold text-amber-700 mb-2">
                              {stats.rating_stats.displayedRating}
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${
                                    i <
                                    Math.floor(
                                      //@ts-ignore
                                      stats.rating_stats.displayedRating!
                                    )
                                      ? "fill-amber-500 text-amber-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-amber-600">
                              out of 5 stars
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-3xl font-bold text-gray-700 mb-2">
                              {stats.rating_stats.statusText}
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-2">
                              <Star className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">
                              Need {5 - stats.rating_stats.totalRatings} more
                              ratings
                            </p>
                          </>
                        )}
                      </div>

                      {/* Middle - Stats */}
                      <div className="text-center border-l border-r border-amber-200">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {stats.rating_stats.totalRatings}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                          <Users className="w-4 h-4" />
                          Total Ratings
                        </p>
                        {stats.rating_stats.totalRatings >= 10 && (
                          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600 bg-green-50 rounded-full px-2 py-1 inline-flex">
                            <TrendingUp className="w-3 h-3" />
                            Lowest rating excluded
                          </div>
                        )}
                      </div>

                      {/* Right - Distribution */}
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count =
                            stats.rating_stats?.ratingDistribution?.[
                              star as keyof typeof stats.rating_stats.ratingDistribution
                            ] ?? 0;
                          const percentage =
                            //@ts-ignore
                            stats?.rating_stats?.totalRatings > 0
                              ? //@ts-ignore

                                (count / stats?.rating_stats?.totalRatings) *
                                100
                              : 0;

                          return (
                            <div key={star} className="flex items-center gap-2">
                              <div className="w-8 text-sm font-medium text-gray-600">
                                {star} ★
                              </div>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="w-8 text-xs text-gray-500 text-right">
                                {count}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recent Reviews */}
                  {stats.rating_stats.recentRatings.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ThumbsUp className="w-5 h-5 text-purple-600" />
                        Recent Reviews
                      </h3>
                      <div className="space-y-4">
                        {stats.rating_stats.recentRatings.map((review) => (
                          <div
                            key={review.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {review.reviewer_avatar ? (
                                  <img
                                    src={review.reviewer_avatar}
                                    alt={review.reviewer_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-gray-600">
                                    {review.reviewer_name
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {review.reviewer_name}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3.5 h-3.5 ${
                                          i < review.rating
                                            ? "fill-amber-500 text-amber-500"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {review.job_title && (
                                  <div className="mb-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
                                      <Briefcase className="w-3 h-3" />
                                      {review.job_title}
                                    </span>
                                  </div>
                                )}

                                {review.review_text && (
                                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-lg">
                                    "{review.review_text}"
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatDate(review.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No ratings yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    This worker hasn't received any ratings yet
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Verification Tab (Worker only) */}
          {activeTab === "verification" && user.role === "worker" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Business Verification
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Verify this worker's business and identity
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    user.business_verified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  <BadgeCheck className="w-4 h-4" />
                  {user.business_verified ? "Verified" : "Not Verified"}
                </span>
              </div>

              {/* Verification Status Card */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Verification Status
                    </p>
                    {user.business_verified ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">
                          Pending Verification
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Verification Checklist
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        user.insurance_verified
                          ? "bg-green-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      {user.insurance_verified ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      Insurance Document
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {user.insurance_verified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        user.bank_name ? "bg-green-100" : "bg-yellow-100"
                      }`}
                    >
                      {user.bank_name ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      Bank Account Information
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {user.bank_name ? "Provided" : "Missing"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        user.skills && user.skills.length > 0
                          ? "bg-green-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      {user.skills && user.skills.length > 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      Skills & Experience
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {user.skills?.length || 0} skills
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        user.job_title ? "bg-green-100" : "bg-yellow-100"
                      }`}
                    >
                      {user.job_title ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      Professional Profile
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {user.job_title || "Incomplete"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!user.business_verified ? (
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    disabled={verificationLoading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {verificationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <BadgeCheck className="w-5 h-5" />
                        Verify Worker
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleUnverifyWorker}
                    disabled={verificationLoading}
                    className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {verificationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-5 h-5" />
                        Remove Verification
                      </>
                    )}
                  </button>
                )}
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
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Insurance Verification
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Verify this worker's insurance document
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      user.insurance_verified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    <BadgeCheck className="w-4 h-4" />
                    {user.insurance_verified ? "Verified" : "Not Verified"}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Insurance Status
                      </p>
                      {user.insurance_verified ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">
                            Pending Verification
                          </span>
                        </div>
                      )}
                    </div>
                    {user.insurance_verified && user.updated_at && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Verified on
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatDate(user.updated_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Insurance Document
                  </h4>
                  <div className="p-6 bg-gray-50 rounded-lg">
                    {user.insurance_url ? (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-700">
                            Insurance document uploaded
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <a
                            href={user.insurance_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            <FileText className="w-4 h-4" />
                            View Document
                          </a>

                          <a
                            href={user.insurance_url}
                            download
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>

                        <div className="mt-4 text-xs text-gray-500">
                          <p>
                            File name: {user.insurance_url.split("/").pop()}
                          </p>
                          <p>
                            Uploaded:{" "}
                            {user.updated_at
                              ? formatDate(user.updated_at)
                              : "Date unknown"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">
                          No insurance document uploaded
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          The worker hasn't uploaded any insurance document yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {user.insurance_url && (
                  <div className="flex gap-3">
                    {!user.insurance_verified ? (
                      <button
                        onClick={() => setShowInsuranceModal(true)}
                        disabled={insuranceLoading}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {insuranceLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <BadgeCheck className="w-5 h-5" />
                            Verify Insurance
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleUnverifyInsurance}
                        disabled={insuranceLoading}
                        className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {insuranceLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-5 h-5" />
                            Remove Verification
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Insurance Requirements
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Valid liability insurance is required for all workers</p>
                  <p>• Insurance must be current and not expired</p>
                  <p>• Document should clearly show:</p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-gray-500">
                    <li>Worker's name matching their profile</li>
                    <li>Insurance company name</li>
                    <li>Policy number</li>
                    <li>Coverage dates</li>
                    <li>Coverage amounts</li>
                  </ul>
                </div>
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
                        {job.pay_type && (
                          <p className="text-xs text-gray-400 mt-1">
                            {job.pay_type}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-900">
                          {formatJobPrice(job)}
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

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Verify Worker
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to verify this worker? This action will mark
              them as a verified professional.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyWorker}
                disabled={verificationLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {verificationLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    Verify
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Verification Modal */}
      {showInsuranceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Verify Insurance
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to verify this worker's insurance? Please
              ensure you have reviewed the insurance document and it meets all
              requirements.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  By verifying this insurance, you confirm that you have
                  reviewed the document and it meets all the insurance
                  requirements.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInsuranceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyInsurance}
                disabled={insuranceLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {insuranceLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    Verify
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
