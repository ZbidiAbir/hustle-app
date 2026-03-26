"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Mail,
  MessageSquare,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Clock,
  Star,
  Image as ImageIcon,
  Eye,
  MoreHorizontal,
  Phone,
  Home,
  Building2,
  Award,
  Shield,
  BadgeCheck,
  TrendingUp,
  Filter,
  Search,
  X,
  AlertCircle,
  Camera,
  FileText,
  ThumbsUp,
  Users,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  fixed_rate?: number;
  min_rate?: number;
  max_rate?: number;
  hourly_rate?: number;
  pay_type?: string;
  location: string;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at?: string;
  images: string[];
  customer_id: string;
  worker_id?: string;
  skills?: string[];
  level_required?: string;
  project_size?: string;
  urgency?: string;
  date?: string;
  time_slot?: string;
  building_access?: string;
  materials_provided?: boolean;
  customer?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
    account_type?: "homeowner" | "smallbusiness";
    company_name?: string;
    business_verified?: boolean;
    rating?: number;
    total_jobs?: number;
  };
  messages_count?: number;
  days_remaining?: number;
};

type JobStats = {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  totalEarnings: number;
  pendingEarnings: number;
  averageRating: number;
  customerSatisfaction: number;
};

// Dispute Modal Component
const DisputeCreationModal = ({
  job,
  onClose,
  onSuccess,
}: {
  job: Job;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [disputeType, setDisputeType] = useState<
    "payment" | "quality" | "timeline" | "communication" | "safety" | "other"
  >("other");
  const [description, setDescription] = useState("");
  const [preferredResolution, setPreferredResolution] = useState("");
  const [evidence, setEvidence] = useState<{ url: string; file?: File }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});

  const disputeTypes = [
    {
      value: "payment",
      label: "Payment Issue",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      value: "quality",
      label: "Quality Issue",
      icon: Star,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      value: "timeline",
      label: "Timeline Issue",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      value: "communication",
      label: "Communication Issue",
      icon: MessageSquare,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      value: "safety",
      label: "Safety Concern",
      icon: Shield,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      value: "other",
      label: "Other Issue",
      icon: AlertTriangle,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `disputes/${job.id}/${fileName}`;

    try {
      // Simuler la progression du téléchargement
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress <= 90) {
            setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
          }
          if (progress >= 90) clearInterval(interval);
        }, 200);
        return interval;
      };

      const progressInterval = simulateProgress();

      const { error: uploadError, data } = await supabase.storage
        .from("dispute-evidence")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);
      setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from("dispute-evidence").getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Vérifier la taille des fichiers (max 10MB par fichier)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(
        `Files too large: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}. Maximum size is 10MB per file.`
      );
      return;
    }

    // Vérifier les types de fichiers autorisés
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const invalidFiles = files.filter(
      (file) => !allowedTypes.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      setError(
        `Invalid file types: ${invalidFiles
          .map((f) => f.name)
          .join(", ")}. Allowed types: images, PDF, Word, and text files only.`
      );
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadPromises = files.map(async (file) => {
        const url = await uploadFileToSupabase(file);
        return { url, file };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setEvidence((prev) => [...prev, ...uploadedFiles]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please provide a description of the issue");
      return;
    }

    if (!preferredResolution.trim()) {
      setError("Please describe your preferred resolution");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to create a dispute");
        setSubmitting(false);
        return;
      }

      // Extraire uniquement les URLs pour l'enregistrement
      const evidenceUrls = evidence.map((e) => e.url);

      const { error: disputeError } = await supabase.from("disputes").insert({
        job_id: job.id,
        created_by: user.id,
        against_user: job.customer_id,
        type: disputeType,
        description: description.trim(),
        preferred_resolution: preferredResolution.trim(),
        evidence: evidenceUrls,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (disputeError) throw disputeError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating dispute:", err);
      setError(err.message || "Failed to create dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase();
    if (extension === "pdf")
      return <FileText className="w-4 h-4 text-red-500" />;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || ""))
      return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (["doc", "docx"].includes(extension || ""))
      return <FileText className="w-4 h-4 text-blue-600" />;
    if (["txt"].includes(extension || ""))
      return <FileText className="w-4 h-4 text-gray-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Report an Issue
              </h2>
              <p className="text-sm text-gray-500">Job: {job.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Dispute Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Issue Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {disputeTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = disputeType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setDisputeType(type.value as any)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? `${type.bg} border-${type.color.split("-")[1]}-500`
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isSelected ? type.color : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? "text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description of the Issue *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Please describe in detail what went wrong..."
            />
          </div>

          {/* Preferred Resolution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Resolution *
            </label>
            <textarea
              value={preferredResolution}
              onChange={(e) => setPreferredResolution(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="How would you like this issue to be resolved?"
            />
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-red-500 transition-colors">
              <div className="space-y-1 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500"
                  >
                    <span>Upload files</span>
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  Images, PDF, Word, or text files up to 10MB each
                </p>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && Object.keys(uploadProgress).length > 0 && (
              <div className="mt-3 space-y-2">
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 truncate flex-1">
                        {fileName}
                      </span>
                      <span className="text-gray-500 ml-2">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Evidence List */}
            {evidence.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Uploaded Files ({evidence.length})
                </p>
                {evidence.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                  >
                    <div className="flex-shrink-0">{getFileIcon(item.url)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 truncate">
                          {item.file?.name ||
                            item.url.split("/").pop() ||
                            "File"}
                        </span>
                        {item.file?.size && (
                          <span className="text-xs text-gray-400">
                            {formatFileSize(item.file.size)}
                          </span>
                        )}
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="w-3 h-3" />
                        View file
                      </a>
                    </div>
                    <button
                      onClick={() => removeEvidence(index)}
                      className="p-1.5 hover:bg-gray-200 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError("")}
                className="p-1 hover:bg-red-100 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Submit Dispute
                </>
              )}
            </button>
          </div>

          {/* Info note */}
          <div className="text-xs text-gray-500 text-center pt-2">
            <p>
              Your dispute will be reviewed by an administrator within 24-48
              hours.
            </p>
            <p className="mt-1">
              All evidence will be kept confidential and only shared with
              involved parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function WorkerMyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "cancelled"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("worker_id", user.id)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;

        const customerIds = jobsData?.map((job) => job.customer_id) || [];
        const { data: customersData } = await supabase
          .from("profiles")
          .select(
            `
            id, 
            full_name, 
            email, 
            avatar_url, 
            phone,
            account_type,
            company_name,
            business_verified
          `
          )
          .in("id", customerIds);

        const customersMap = new Map(
          customersData?.map((c) => [c.id, c]) || []
        );

        const jobsWithDetails = await Promise.all(
          (jobsData || []).map(async (job) => {
            const { count: messagesCount } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("job_id", job.id);

            const { data: reviews } = await supabase
              .from("reviews")
              .select("rating")
              .eq("customer_id", job.customer_id);

            const avgRating = reviews?.length
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : 4.5;

            let daysRemaining;
            if (
              job.date &&
              (job.status === "assigned" || job.status === "in_progress")
            ) {
              const jobDate = new Date(job.date);
              const today = new Date();
              const diffTime = jobDate.getTime() - today.getTime();
              daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return {
              ...job,
              customer: {
                ...customersMap.get(job.customer_id),
                full_name:
                  customersMap.get(job.customer_id)?.full_name || "Client",
                email: customersMap.get(job.customer_id)?.email || "",
                rating: avgRating,
                total_jobs: reviews?.length || 0,
              },
              messages_count: messagesCount || 0,
              days_remaining: daysRemaining,
            };
          })
        );

        setJobs(jobsWithDetails);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [router]
  );

  const updateJobStatus = useCallback(
    async (jobId: string, newStatus: string) => {
      try {
        const { error } = await supabase
          .from("jobs")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);

        if (error) throw error;

        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, status: newStatus as Job["status"] }
              : job
          )
        );

        const messages = {
          in_progress: "✅ Job started successfully!",
          completed: "✅ Job marked as completed! Great work!",
        };
        alert(messages[newStatus as keyof typeof messages]);
      } catch (error: any) {
        alert(`❌ Error: ${error.message}`);
      }
    },
    []
  );

  const formatPrice = (job: Job) => {
    if (!job) return "$0";

    switch (job.pay_type) {
      case "Fixed":
        return job.fixed_rate
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
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

  const stats = useMemo<JobStats>(() => {
    const active = jobs.filter(
      (j) => j.status === "assigned" || j.status === "in_progress"
    );
    const completed = jobs.filter((j) => j.status === "completed");
    const cancelled = jobs.filter((j) => j.status === "cancelled");

    const calculateEarnings = (job: Job) => {
      if (job.pay_type === "Fixed" && job.fixed_rate) return job.fixed_rate;
      if (job.pay_type === "Hourly" && job.hourly_rate)
        return job.hourly_rate * 8;
      return job.price || 0;
    };

    const totalEarnings = completed.reduce(
      (sum, job) => sum + calculateEarnings(job),
      0
    );
    const pendingEarnings = active.reduce(
      (sum, job) => sum + calculateEarnings(job),
      0
    );

    const ratings = completed
      .map((j) => j.customer?.rating || 0)
      .filter((r) => r > 0);
    const averageRating = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    return {
      total: jobs.length,
      active: active.length,
      completed: completed.length,
      cancelled: cancelled.length,
      totalEarnings,
      pendingEarnings,
      averageRating,
      customerSatisfaction: averageRating * 20,
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    if (filter === "active") {
      filtered = filtered.filter(
        (job) => job.status === "assigned" || job.status === "in_progress"
      );
    } else if (filter === "completed") {
      filtered = filtered.filter((job) => job.status === "completed");
    } else if (filter === "cancelled") {
      filtered = filtered.filter((job) => job.status === "cancelled");
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.category.toLowerCase().includes(term) ||
          job.location.toLowerCase().includes(term) ||
          job.customer?.full_name.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      const getPrice = (job: Job) => {
        if (job.pay_type === "Fixed") return job.fixed_rate || 0;
        if (job.pay_type === "Hourly") return (job.hourly_rate || 0) * 8;
        if (job.pay_type === "Range") return job.max_rate || 0;
        return job.price || 0;
      };

      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "highest":
          return getPrice(b) - getPrice(a);
        case "lowest":
          return getPrice(a) - getPrice(b);
        default:
          return 0;
      }
    });

    return filtered;
  }, [jobs, filter, searchTerm, sortBy]);

  const getStatusConfig = (status: string) => {
    const configs = {
      assigned: {
        icon: Clock,
        text: "To Start",
        bg: "bg-blue-50",
        textColor: "text-blue-700",
        border: "border-blue-200",
        iconColor: "text-blue-500",
        dot: "bg-blue-500",
        gradient: "from-blue-500 to-blue-600",
        action: "Start",
        actionColor: "blue",
      },
      in_progress: {
        icon: Play,
        text: "In Progress",
        bg: "bg-amber-50",
        textColor: "text-amber-700",
        border: "border-amber-200",
        iconColor: "text-amber-500",
        dot: "bg-amber-500",
        gradient: "from-amber-500 to-orange-500",
        action: "Complete",
        actionColor: "green",
      },
      completed: {
        icon: CheckCircle,
        text: "Completed",
        bg: "bg-emerald-50",
        textColor: "text-emerald-700",
        border: "border-emerald-200",
        iconColor: "text-emerald-500",
        dot: "bg-emerald-500",
        gradient: "from-emerald-500 to-teal-500",
      },
      cancelled: {
        icon: XCircle,
        text: "Cancelled",
        bg: "bg-rose-50",
        textColor: "text-rose-700",
        border: "border-rose-200",
        iconColor: "text-rose-500",
        dot: "bg-rose-500",
        gradient: "from-rose-500 to-pink-500",
      },
    };
    return configs[status as keyof typeof configs] || configs.assigned;
  };

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} min ago`;
      }
      return `${diffHours} hour ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = useCallback((id: string) => {
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
  }, []);

  const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium ${
              trend >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );

  const JobDetailModal = ({
    job,
    onClose,
  }: {
    job: Job;
    onClose: () => void;
  }) => {
    const statusConfig = getStatusConfig(job.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className={`h-2 bg-gradient-to-r ${statusConfig.gradient}`} />

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                <StatusIcon className={`w-4 h-4 ${statusConfig.iconColor}`} />
                {statusConfig.text}
              </span>
              <span className="text-sm text-gray-500">
                Posted {formatDate(job.created_at)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Budget</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(job)}
                </p>
                {job.pay_type && (
                  <p className="text-xs text-gray-500 mt-1">{job.pay_type}</p>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Location</p>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {job.location}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {job.skills && job.skills.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {job.project_size && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Project Size</p>
                    <p className="font-medium text-gray-900">
                      {job.project_size}
                    </p>
                  </div>
                )}
                {job.urgency && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Urgency</p>
                    <p className="font-medium text-gray-900">{job.urgency}</p>
                  </div>
                )}
                {job.date && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Scheduled Date</p>
                    <p className="font-medium text-gray-900">
                      {formatFullDate(job.date)}
                    </p>
                  </div>
                )}
                {job.time_slot && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Time Slot</p>
                    <p className="font-medium text-gray-900">{job.time_slot}</p>
                  </div>
                )}
              </div>

              {job.images && job.images.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Photos</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {job.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Job photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => setSelectedImage(img)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {job.customer && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Client</h3>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full ${getAvatarColor(
                        job.customer.id
                      )} flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {job.customer.avatar_url ? (
                        <img
                          src={job.customer.avatar_url}
                          alt={job.customer.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(job.customer.full_name)
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {job.customer.full_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-3 h-3" />
                        <a
                          href={`mailto:${job.customer.email}`}
                          className="hover:text-blue-600"
                        >
                          {job.customer.email}
                        </a>
                      </div>
                      {job.customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Phone className="w-3 h-3" />
                          <a
                            href={`tel:${job.customer.phone}`}
                            className="hover:text-blue-600"
                          >
                            {job.customer.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
              <Link
                href={`/worker/dashboard/chat/${job.id}`}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Client
              </Link>

              {job.status === "assigned" && (
                <button
                  onClick={() => {
                    updateJobStatus(job.id, "in_progress");
                    onClose();
                  }}
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Job
                </button>
              )}

              {job.status === "in_progress" && (
                <button
                  onClick={() => {
                    updateJobStatus(job.id, "completed");
                    onClose();
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete Job
                </button>
              )}
            </div>

            {/* Report Issue Button */}
            {/* Report Issue Button - UNIQUEMENT POUR LES JOBS COMPLETED */}
            {job.status === "completed" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJob(job);
                  setShowDisputeModal(true);
                }}
                className="px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition"
                title="Report Issue"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading your jobs...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                My Jobs
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {stats.total} total · {stats.active} active · {stats.completed}{" "}
                completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition ${
                  showFilters || searchTerm || sortBy !== "newest"
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => fetchMyJobs(true)}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                <Loader2
                  className={`w-5 h-5 text-gray-600 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
              <Link
                href="/worker/dashboard/jobs"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-500/25"
              >
                Browse Jobs
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard
              label="Active Jobs"
              value={stats.active}
              icon={Play}
              color="bg-blue-100 text-blue-600"
              trend={12}
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircle}
              color="bg-emerald-100 text-emerald-600"
              trend={8}
            />
            <StatCard
              label="Total Earnings"
              value={`$${stats.totalEarnings.toLocaleString()}`}
              icon={DollarSign}
              color="bg-purple-100 text-purple-600"
              trend={15}
            />
            <StatCard
              label="Satisfaction"
              value={`${stats.customerSatisfaction.toFixed(0)}%`}
              icon={ThumbsUp}
              color="bg-amber-100 text-amber-600"
              trend={5}
            />
          </div>

          {/* Search and Filters */}
          {(showFilters || searchTerm) && (
            <div className="space-y-3 animate-fadeIn">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, category, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest">Highest price</option>
                  <option value="lowest">Lowest price</option>
                </select>
              </div>
            </div>
          )}

          {/* Filter Chips */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {(["all", "active", "completed", "cancelled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap ${
                  filter === f
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f === "all"
                  ? "All Jobs"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ml-2 text-xs opacity-75">
                  {f === "all"
                    ? stats.total
                    : f === "active"
                    ? stats.active
                    : f === "completed"
                    ? stats.completed
                    : stats.cancelled}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => {
              const statusConfig = getStatusConfig(job.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={job.id}
                  className="group bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setSelectedJob(job);
                    setShowJobModal(true);
                  }}
                >
                  {/* Status Bar */}
                  <div
                    className={`h-1.5 bg-gradient-to-r ${statusConfig.gradient}`}
                  />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}
                        >
                          <StatusIcon
                            className={`w-3 h-3 ${statusConfig.iconColor}`}
                          />
                          <span
                            className={`text-xs font-medium ${statusConfig.textColor}`}
                          >
                            {statusConfig.text}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(job.created_at)}
                        </span>
                      </div>
                      {job.messages_count ? (
                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <MessageSquare className="w-3 h-3" />
                          {job.messages_count}
                        </div>
                      ) : null}
                    </div>

                    {/* Title and Price */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-semibold text-gray-900 line-clamp-1 flex-1 group-hover:text-blue-600 transition">
                        {job.title}
                      </h3>
                      <span className="text-lg font-bold text-emerald-600 ml-2">
                        {formatPrice(job)}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{job.location}</span>
                    </div>

                    {/* Customer Info */}
                    {job.customer && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full ${getAvatarColor(
                              job.customer.id
                            )} flex items-center justify-center text-white text-xs font-medium shadow-sm flex-shrink-0`}
                          >
                            {job.customer.avatar_url ? (
                              <img
                                src={job.customer.avatar_url}
                                alt={job.customer.full_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(job.customer.full_name)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {job.customer.full_name}
                              </p>
                              {job.customer.business_verified && (
                                <BadgeCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              {job.customer.account_type === "smallbusiness" ? (
                                <Building2 className="w-3 h-3 text-gray-400" />
                              ) : (
                                <Home className="w-3 h-3 text-gray-400" />
                              )}
                              <span className="text-gray-500 truncate">
                                {job.customer.account_type === "smallbusiness"
                                  ? "Business"
                                  : "Homeowner"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Image Preview */}
                    {job.images && job.images.length > 0 && (
                      <div className="mb-3">
                        <div className="flex gap-2">
                          {job.images.slice(0, 3).map((img, idx) => (
                            <div
                              key={idx}
                              className="relative group/img"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(img);
                              }}
                            >
                              <img
                                src={img}
                                alt={`Job photo ${idx + 1}`}
                                className="w-14 h-14 object-cover rounded-lg border border-gray-200 group-hover/img:opacity-90 transition"
                              />
                              {idx === 2 && job.images.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">
                                    +{job.images.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Days Remaining */}
                    {job.days_remaining && job.days_remaining > 0 && (
                      <div className="mb-3 flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="text-amber-600 font-medium">
                          {job.days_remaining} day
                          {job.days_remaining > 1 ? "s" : ""} remaining
                        </span>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                      <Link
                        href={`/worker/dashboard/chat/${job.id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                      </Link>

                      {job.status === "assigned" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateJobStatus(job.id, "in_progress");
                          }}
                          className="flex-1 px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-4 h-4" />
                          Start
                        </button>
                      )}

                      {job.status === "in_progress" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateJobStatus(job.id, "completed");
                          }}
                          className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Complete
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJob(job);
                          setShowJobModal(true);
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Report Issue Button - UNIQUEMENT POUR LES JOBS COMPLETED */}
                      {job.status === "completed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJob(job);
                            setShowDisputeModal(true);
                          }}
                          className="px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition"
                          title="Report Issue"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-10 h-10 text-blue-600/40" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? "No matching jobs" : "No jobs found"}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              {searchTerm
                ? "Try adjusting your search or filters"
                : filter !== "all"
                ? `You don't have any ${filter} jobs yet`
                : "You haven't been assigned to any jobs yet"}
            </p>
            {(searchTerm || filter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                  setSortBy("newest");
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {showJobModal && selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setShowJobModal(false)}
        />
      )}

      {/* Dispute Creation Modal */}
      {showDisputeModal && selectedJob && (
        <DisputeCreationModal
          job={selectedJob}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedJob(null);
          }}
          onSuccess={() => {
            alert(
              "✅ Dispute created successfully! An admin will review your case shortly."
            );
          }}
        />
      )}
    </div>
  );
}
