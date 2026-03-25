"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Landmark,
  FileText,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Upload,
  Save,
  Loader2,
  Calendar,
  Clock,
  Shield,
  AlertCircle,
  X,
  Star,
  TrendingUp,
  Award,
  ThumbsUp,
  Users,
} from "lucide-react";
import { useWorkerProfile } from "@/lib/hooks/useWorkerProfile";
import { TabType, EmploymentType, ExperienceForm } from "@/types/profile";
import { supabase } from "@/lib/supabase";

interface RatingStats {
  averageRating: number | null;
  totalRatings: number;
  isEstablished: boolean;
  displayedRating: number | null;
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
}
export default function WorkerProfilePage() {
  const {
    profile,
    workExperience,
    loading,
    saving,
    uploading,
    uploadingAvatar,
    successMessage,
    errorMessage,
    updateBasicInfo,
    updateProfessionalInfo,
    updatePaymentInfo,
    uploadAvatar,
    removeAvatar,
    uploadInsurance,
    removeInsurance,
    addExperience,
    updateExperience,
    deleteExperience,
  } = useWorkerProfile();

  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [editingExperience, setEditingExperience] = useState<string | null>(
    null
  );
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // États pour les formulaires
  const [basicInfoForm, setBasicInfoForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
  });

  const [professionalForm, setProfessionalForm] = useState({
    job_title: "",
    trade_category: "",
    level: "",
    skills: [] as string[],
  });

  const [paymentForm, setPaymentForm] = useState({
    rate_type: null as "hourly" | "fixed" | "project" | null,
    hourly_rate: 0,
    bank_name: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_routing_number: "",
  });

  const [expForm, setExpForm] = useState<ExperienceForm>({
    company_name: "",
    location: "",
    position: "",
    employment_type: "full-time",
    start_date: "",
    end_date: "",
    current: false,
    description: "",
  });

  // Fonction pour récupérer les statistiques de rating
  // Fonction pour récupérer les statistiques de rating
  // Fonction pour récupérer les statistiques de rating
  const fetchRatingStats = async () => {
    if (!profile?.id) return;

    setLoadingRatings(true);
    try {
      // Récupérer tous les ratings du worker avec les jobs associés
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
        .eq("reviewee_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const totalRatings = ratings?.length ?? 0;

      // Distribution des notes
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings?.forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) {
          distribution[r.rating as keyof typeof distribution]++;
        }
      });

      // Calculer la moyenne selon la formule
      let averageRating = null;
      let displayedRating = null;
      let isEstablished = false;
      let statusText = "No ratings yet";

      if (totalRatings > 0) {
        if (totalRatings >= 5) {
          isEstablished = true;
          if (totalRatings >= 10) {
            const sortedRatings = [...ratings].sort(
              (a, b) => a.rating - b.rating
            );
            const ratingsWithoutLowest = sortedRatings.slice(1);
            const sum = ratingsWithoutLowest.reduce(
              (acc, r) => acc + r.rating,
              0
            );
            averageRating = sum / ratingsWithoutLowest.length;
            displayedRating = parseFloat(averageRating.toFixed(1));
            statusText = "Established";
          } else {
            const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
            averageRating = sum / totalRatings;
            displayedRating = parseFloat(averageRating.toFixed(1));
            statusText = "Established";
          }
        } else {
          const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
          averageRating = sum / totalRatings;
          displayedRating = null;
          statusText = totalRatings === 1 ? "New" : "Establishing";
        }
      }

      // Récupérer les infos des reviewers et les titres des jobs
      const reviewerIds = [
        ...new Set(ratings?.map((r) => r.reviewer_id).filter(Boolean) || []),
      ];
      const jobIds = [
        ...new Set(ratings?.map((r) => r.job_id).filter(Boolean) || []),
      ];

      let reviewersMap = new Map();
      let jobsMap = new Map();

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
      if (jobIds.length > 0) {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title")
          .in("id", jobIds);

        jobs?.forEach((j) => {
          jobsMap.set(j.id, j.title);
        });
      }

      // Construire les ratings récents
      const recentRatings =
        ratings?.slice(0, 5).map((r) => ({
          id: r.id,
          rating: r.rating,
          review_text: r.review_text,
          created_at: r.created_at,
          reviewer_name: reviewersMap.get(r.reviewer_id)?.name || "Anonymous",
          reviewer_avatar: reviewersMap.get(r.reviewer_id)?.avatar,
          job_title: jobsMap.get(r.job_id) || undefined,
        })) || [];

      setRatingStats({
        averageRating,
        totalRatings,
        isEstablished,
        displayedRating,
        statusText,
        ratingDistribution: distribution,
        recentRatings,
      });
    } catch (error) {
      console.error("Error fetching rating stats:", error);
      // En cas d'erreur, définir un état par défaut
      setRatingStats({
        averageRating: null,
        totalRatings: 0,
        isEstablished: false,
        displayedRating: null,
        statusText: "No ratings yet",
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentRatings: [],
      });
    } finally {
      setLoadingRatings(false);
    }
  };

  // Mettre à jour les formulaires quand le profil est chargé
  useEffect(() => {
    if (profile) {
      setBasicInfoForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
      });

      setProfessionalForm({
        job_title: profile.job_title || "",
        trade_category: profile.trade_category || "",
        level: profile.level || "",
        skills: profile.skills || [],
      });

      setPaymentForm({
        rate_type: profile.rate_type || null,
        hourly_rate: profile.hourly_rate || 0,
        bank_name: profile.bank_name || "",
        bank_account_holder: profile.bank_account_holder || "",
        bank_account_number: profile.bank_account_number || "",
        bank_routing_number: profile.bank_routing_number || "",
      });

      // Récupérer les statistiques de rating
      fetchRatingStats();
    }
  }, [profile]);

  const handleBasicInfoChange = (
    field: keyof typeof basicInfoForm,
    value: string
  ) => {
    setBasicInfoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfessionalChange = (
    field: keyof typeof professionalForm,
    value: any
  ) => {
    setProfessionalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field: keyof typeof paymentForm, value: any) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (value: string) => {
    const skillsArray = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setProfessionalForm((prev) => ({ ...prev, skills: skillsArray }));
  };

  const handleBasicInfoSubmit = async () => {
    await updateBasicInfo(basicInfoForm);
  };

  const handleProfessionalSubmit = async () => {
    await updateProfessionalInfo(professionalForm);
  };

  const handlePaymentSubmit = async () => {
    await updatePaymentInfo(paymentForm);
  };

  const handleExperienceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingExperience) {
      await updateExperience(editingExperience, expForm);
    } else {
      await addExperience(expForm);
    }

    resetExperienceForm();
  };

  const resetExperienceForm = () => {
    setExpForm({
      company_name: "",
      location: "",
      position: "",
      employment_type: "full-time",
      start_date: "",
      end_date: "",
      current: false,
      description: "",
    });
    setEditingExperience(null);
    setShowExperienceForm(false);
  };

  const editExperience = (exp: (typeof workExperience)[0]) => {
    setEditingExperience(exp.id);
    setExpForm({
      company_name: exp.company_name,
      location: exp.location || "",
      position: exp.position,
      employment_type: exp.employment_type,
      start_date: exp.start_date,
      end_date: exp.end_date || "",
      current: exp.current,
      description: exp.description || "",
    });
    setShowExperienceForm(true);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Messages de notification */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec profil et rating */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Profile"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(profile?.full_name)
                )}
              </div>

              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-white" />
                )}
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />

              {profile?.avatar_url && (
                <button
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                  title="Remove avatar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.full_name || "Worker Profile"}
                </h1>
                {/* Rating Display */}
                {ratingStats?.isEstablished && ratingStats.displayedRating && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(ratingStats.displayedRating!)
                              ? "fill-amber-500 text-amber-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-amber-700">
                      {ratingStats.displayedRating}
                    </span>
                    <span className="text-xs text-amber-600">
                      ({ratingStats.totalRatings})
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </span>
                {profile?.phone && (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {profile.phone}
                    </span>
                  </>
                )}
                {(profile?.address || profile?.city) && (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {[profile.address, profile.city]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                Worker
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-1 overflow-x-auto pb-1">
              {[
                { id: "info", label: "Basic Info", icon: User },
                { id: "experience", label: "Experience", icon: Briefcase },
                { id: "ratings", label: "Ratings", icon: Star },
                { id: "payment", label: "Payment", icon: DollarSign },
                { id: "insurance", label: "Insurance", icon: Shield },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-white text-purple-600 border-t border-l border-r border-gray-200 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Basic Info Tab */}
          {activeTab === "info" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Basic Information
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ... contenu existant du formulaire basic info ... */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={basicInfoForm.full_name}
                      onChange={(e) =>
                        handleBasicInfoChange("full_name", e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ""}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={basicInfoForm.phone}
                      onChange={(e) =>
                        handleBasicInfoChange("phone", e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      value={basicInfoForm.address}
                      onChange={(e) =>
                        handleBasicInfoChange("address", e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      value={basicInfoForm.city}
                      onChange={(e) =>
                        handleBasicInfoChange("city", e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="New York"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleBasicInfoSubmit}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    Professional Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ... contenu existant du formulaire pro ... */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={professionalForm.job_title}
                        onChange={(e) =>
                          handleProfessionalChange("job_title", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="e.g., Senior Plumber"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Trade Category
                      </label>
                      <select
                        value={professionalForm.trade_category}
                        onChange={(e) =>
                          handleProfessionalChange(
                            "trade_category",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      >
                        <option value="">Select a category</option>
                        <option value="plumbing">Plumbing</option>
                        <option value="electrical">Electrical</option>
                        <option value="carpentry">Carpentry</option>
                        <option value="painting">Painting</option>
                        <option value="hvac">HVAC</option>
                        <option value="landscaping">Landscaping</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="moving">Moving</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Level
                      </label>
                      <select
                        value={professionalForm.level}
                        onChange={(e) =>
                          handleProfessionalChange("level", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      >
                        <option value="">Select level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="expert">Expert</option>
                        <option value="master">Master</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Skills
                      </label>
                      <input
                        type="text"
                        value={professionalForm.skills.join(", ")}
                        onChange={(e) => handleSkillsChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="Plumbing, Pipe Repair, Installation"
                      />
                      <p className="text-xs text-gray-500">
                        Separate skills with commas
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleProfessionalSubmit}
                      disabled={saving}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Professional Info
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === "experience" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  Work Experience
                </h2>
                <button
                  onClick={() => setShowExperienceForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition flex items-center gap-2 text-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Experience
                </button>
              </div>

              {showExperienceForm && (
                <form
                  onSubmit={handleExperienceSubmit}
                  className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 mb-6 space-y-4"
                >
                  <h3 className="font-medium text-gray-900 mb-4">
                    {editingExperience ? "Edit Experience" : "New Experience"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ... formulaire expérience existant ... */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={expForm.company_name}
                        onChange={(e) =>
                          setExpForm({
                            ...expForm,
                            company_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <input
                        type="text"
                        value={expForm.location}
                        onChange={(e) =>
                          setExpForm({ ...expForm, location: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Position *
                      </label>
                      <input
                        type="text"
                        required
                        value={expForm.position}
                        onChange={(e) =>
                          setExpForm({ ...expForm, position: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Employment Type
                      </label>
                      <select
                        value={expForm.employment_type}
                        onChange={(e) =>
                          setExpForm({
                            ...expForm,
                            employment_type: e.target.value as EmploymentType,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={expForm.start_date}
                        onChange={(e) =>
                          setExpForm({ ...expForm, start_date: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={expForm.end_date}
                        onChange={(e) =>
                          setExpForm({ ...expForm, end_date: e.target.value })
                        }
                        disabled={expForm.current}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:bg-gray-100"
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expForm.current}
                          onChange={(e) =>
                            setExpForm({
                              ...expForm,
                              current: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">
                          I currently work here
                        </span>
                      </label>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={expForm.description}
                        onChange={(e) =>
                          setExpForm({
                            ...expForm,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="Describe your responsibilities and achievements..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={resetExperienceForm}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition shadow-sm"
                    >
                      {editingExperience ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {workExperience.map((exp) => (
                  <div
                    key={exp.id}
                    className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {exp.position}
                          </h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {exp.employment_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {exp.company_name}
                        </p>
                        {exp.location && (
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {exp.location}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(exp.start_date).toLocaleDateString()} -
                          {exp.current
                            ? " Present"
                            : exp.end_date
                            ? new Date(exp.end_date).toLocaleDateString()
                            : ""}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-lg">
                            {exp.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => editExperience(exp)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => deleteExperience(exp.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {workExperience.length === 0 && !showExperienceForm && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No work experience added yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ratings Tab */}
          {
            //@ts-ignore
            activeTab === "ratings" && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  My Ratings & Reviews
                </h2>

                {loadingRatings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  </div>
                ) : ratingStats && ratingStats.totalRatings > 0 ? (
                  <div className="space-y-6">
                    {/* Rating Summary Card */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left - Overall Rating */}
                        <div className="text-center">
                          {ratingStats.isEstablished &&
                          ratingStats.displayedRating ? (
                            <>
                              <div className="text-5xl font-bold text-amber-700 mb-2">
                                {ratingStats.displayedRating}
                              </div>
                              <div className="flex items-center justify-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-5 h-5 ${
                                      i <
                                      Math.floor(ratingStats.displayedRating!)
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
                                {ratingStats.statusText}
                              </div>
                              <div className="flex items-center justify-center gap-1 mb-2">
                                <Star className="w-5 h-5 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">
                                Need {5 - (ratingStats.totalRatings ?? 0)} more
                                ratings
                              </p>
                            </>
                          )}
                        </div>

                        {/* Middle - Stats */}
                        <div className="text-center border-l border-r border-amber-200">
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {ratingStats.totalRatings ?? 0}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                            <Users className="w-4 h-4" />
                            Total Ratings
                          </p>
                          {(ratingStats.totalRatings ?? 0) >= 10 && (
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
                              ratingStats.ratingDistribution?.[
                                star as keyof typeof ratingStats.ratingDistribution
                              ] ?? 0;
                            const totalRatings = ratingStats.totalRatings ?? 0;
                            const percentage =
                              totalRatings > 0
                                ? (count / totalRatings) * 100
                                : 0;

                            return (
                              <div
                                key={star}
                                className="flex items-center gap-2"
                              >
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
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-purple-600" />
                        Recent Reviews
                      </h3>
                      <div className="space-y-4">
                        {ratingStats.recentRatings?.map((review) => (
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
                                      ?.charAt(0)
                                      .toUpperCase() || "?"}
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
                                          i < (review.rating ?? 0)
                                            ? "fill-amber-500 text-amber-500"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {/* Job Title */}
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
                                  {review.created_at
                                    ? formatDate(review.created_at)
                                    : "Recently"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No ratings yet
                    </h3>
                    <p className="text-sm text-gray-500">
                      Complete jobs and provide excellent service to receive
                      ratings
                    </p>
                  </div>
                )}
              </div>
            )
          }
          {/* Payment Tab */}
          {activeTab === "payment" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Payment Preferences
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Rate Type
                    </label>
                    <select
                      value={paymentForm.rate_type || ""}
                      onChange={(e) =>
                        handlePaymentChange("rate_type", e.target.value || null)
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    >
                      <option value="">Select rate type</option>
                      <option value="hourly">Hourly</option>
                      <option value="fixed">Fixed</option>
                      <option value="project">Project</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Hourly Rate ($/hr)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentForm.hourly_rate || ""}
                        onChange={(e) =>
                          handlePaymentChange(
                            "hourly_rate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-purple-600" />
                    Bank Account Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={paymentForm.bank_name}
                        onChange={(e) =>
                          handlePaymentChange("bank_name", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="Chase, Bank of America, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={paymentForm.bank_account_holder}
                        onChange={(e) =>
                          handlePaymentChange(
                            "bank_account_holder",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={paymentForm.bank_account_number}
                        onChange={(e) =>
                          handlePaymentChange(
                            "bank_account_number",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="**** **** **** 1234"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Routing Number
                      </label>
                      <input
                        type="text"
                        value={paymentForm.bank_routing_number}
                        onChange={(e) =>
                          handlePaymentChange(
                            "bank_routing_number",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Payment Info
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Insurance Tab */}
          {activeTab === "insurance" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Insurance
              </h2>

              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                {profile?.insurance_url ? (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Insurance Document
                        </p>
                        <p className="text-sm text-gray-500">
                          Uploaded and ready
                        </p>
                      </div>
                      {profile.insurance_verified ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <a
                        href={profile.insurance_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Document
                      </a>

                      <button
                        onClick={removeInsurance}
                        className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-purple-400 transition">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Upload Insurance Document
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        PDF only, max 5MB
                      </p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadInsurance(file);
                        }}
                        className="hidden"
                        id="insurance-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="insurance-upload"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition cursor-pointer shadow-sm"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Select PDF File
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Your insurance document will be verified by our team within
                  24-48 hours.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
