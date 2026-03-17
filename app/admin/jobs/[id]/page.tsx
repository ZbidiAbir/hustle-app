"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Star,
  Mail,
  Phone,
  Shield,
  Award,
  FileText,
  Image as ImageIcon,
  Download,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Users,
  Zap,
  Home,
  Building2,
  Menu,
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  fixed_rate?: number;
  min_rate?: number;
  max_rate?: number;
  hourly_rate?: number;
  pay_type?: string;
  location: string;
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  urgency?: string;
  level_required?: string;
  materials_provided?: boolean;
  skills?: string[];
  images?: string[];
  customer_id: string;
  worker_id?: string;
  building_access?: string;
  project_size?: string;
  date?: string;
  time_slot?: string;
  coi_url?: string;
  customer?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  worker?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  applications_count?: number;
};

type Application = {
  id: string;
  worker_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  message?: string;
  worker?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
};

export default function AdminJobDetailPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const params = useParams();
  const router = useRouter();

  const jobId = params?.id as string;

  useEffect(() => {
    if (!jobId || jobId === "undefined" || jobId === "null") {
      setError("Job ID is missing or invalid");
      setLoading(false);
      return;
    }

    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching job with ID:", jobId);

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(jobId)) {
        setError("Invalid job ID format");
        setLoading(false);
        return;
      }

      // 1. Récupérer les détails du job
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) {
        console.error("❌ Job fetch error:", jobError);
        if (jobError.code === "PGRST116") {
          setError("Job not found");
        } else {
          throw jobError;
        }
        setLoading(false);
        return;
      }

      if (!jobData) {
        setError("Job not found");
        setLoading(false);
        return;
      }

      console.log("✅ Job data fetched:", jobData);

      // 2. Récupérer les infos du client
      const { data: customerData, error: customerError } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", jobData.customer_id)
        .single();

      if (customerError) {
        console.error("⚠️ Customer fetch error:", customerError);
      }

      // 3. Récupérer les infos du worker si assigné
      let workerData = null;
      if (jobData.worker_id) {
        const { data, error: workerError } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", jobData.worker_id)
          .single();

        if (workerError) {
          console.error("⚠️ Worker fetch error:", workerError);
        } else {
          workerData = data;
        }
      }

      // 4. Récupérer les candidatures pour ce job
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select("id, worker_id, status, message, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (appsError) {
        console.error("⚠️ Applications fetch error:", appsError);
        setApplications([]);
      } else {
        console.log("✅ Applications fetched:", appsData);

        if (appsData && appsData.length > 0) {
          const workerIds = appsData.map((app) => app.worker_id);
          const { data: workersData, error: workersError } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", workerIds);

          if (workersError) {
            console.error("⚠️ Workers fetch error:", workersError);
          }

          const workersMap = new Map();
          workersData?.forEach((worker) => {
            workersMap.set(worker.id, worker);
          });

          const appsWithWorkers = appsData.map((app) => ({
            ...app,
            worker: workersMap.get(app.worker_id) || {
              full_name: "Unknown Worker",
              email: "unknown@email.com",
            },
          }));

          setApplications(appsWithWorkers);
        } else {
          setApplications([]);
        }
      }

      setJob({
        ...jobData,
        customer: customerData,
        worker: workerData,
      });
    } catch (err: any) {
      console.error("❌ Error fetching job details:", err);
      setError(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (error) throw error;

      setJob(job ? { ...job, status: newStatus as any } : null);

      if (newStatus === "completed") {
        alert("Job marked as completed successfully!");
      } else if (newStatus === "cancelled") {
        alert("Job cancelled successfully!");
      } else if (newStatus === "deleted") {
        router.push("/admin/jobs");
      }
    } catch (err) {
      console.error("Error changing job status:", err);
      alert("Failed to update job status");
    }
  };

  const formatPrice = (job: Job) => {
    if (job.pay_type === "Fixed" && job.fixed_rate) {
      return `$${job.fixed_rate}`;
    } else if (job.pay_type === "Range" && job.min_rate && job.max_rate) {
      return `$${job.min_rate} - $${job.max_rate}`;
    } else if (job.pay_type === "Hourly" && job.hourly_rate) {
      return `$${job.hourly_rate}/hr`;
    } else if (job.price) {
      return `$${job.price}`;
    }
    return "Price TBD";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: "bg-emerald-100 text-emerald-800 border-emerald-200",
      assigned: "bg-blue-100 text-blue-800 border-blue-200",
      in_progress: "bg-amber-100 text-amber-800 border-amber-200",
      completed: "bg-purple-100 text-purple-800 border-purple-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Briefcase className="w-4 h-4" />;
      case "assigned":
        return <Users className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full whitespace-nowrap">
            Pending
          </span>
        );
      case "accepted":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full whitespace-nowrap">
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
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

  const getImageUrl = (img: string) => {
    if (!img) return null;

    if (img.startsWith("http://") || img.startsWith("https://")) {
      return img;
    }

    if (img.startsWith("job-images/")) {
      return `https://ixgajedhkwxxacebyanj.supabase.co/storage/v1/object/public/${img}`;
    }

    if (job?.id) {
      return `https://ixgajedhkwxxacebyanj.supabase.co/storage/v1/object/public/job-images/${job.id}/${img}`;
    }

    return `https://ixgajedhkwxxacebyanj.supabase.co/storage/v1/object/public/job-images/${img}`;
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => ({ ...prev, [index]: true }));
    console.log(`✅ Image ${index} loaded successfully`);
  };

  const handleImageError = (index: number, url: string) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
    console.error(`❌ Failed to load image at index ${index}: ${url}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full p-6 sm:p-8 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {error || "Job Not Found"}
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {error || "The job you're looking for doesn't exist."}
          </p>
          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full sm:w-auto justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const jobNumber = job.id.slice(0, 4).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Breadcrumb - Responsive */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          {/* Mobile Header with Menu */}
          <div className="flex items-center justify-between lg:hidden mb-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                JOB-{jobNumber}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                  job.status
                )}`}
              >
                {getStatusIcon(job.status)}
                <span className="hidden xs:inline">
                  {job.status === "open"
                    ? "Open"
                    : job.status.replace("_", " ")}
                </span>
              </span>
            </div>
            <div className="w-8" /> {/* Spacer */}
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mb-4 pb-4 border-b border-gray-200">
              <div className="space-y-2">
                <Link
                  href="/admin/jobs"
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  ← Back to Jobs
                </Link>
                <Link
                  href={`/admin/jobs/${job.id}/edit`}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Edit Job
                </Link>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this job?")) {
                      handleStatusChange(job.id, "cancelled");
                    }
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Delete Job
                </button>
              </div>
            </div>
          )}

          {/* Desktop Breadcrumb */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link
                href="/admin/jobs"
                className="hover:text-gray-700 transition"
              >
                Job Management
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link
                href="/admin/jobs?status=open"
                className="hover:text-gray-700 transition"
              >
                Job open
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">JOB-{jobNumber}</span>
            </div>
          </div>

          {/* Title and Actions - Desktop */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                JOB-{jobNumber}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  job.status
                )}`}
              >
                {getStatusIcon(job.status)}
                {job.status === "open"
                  ? "Job Open"
                  : job.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/jobs/${job.id}/edit`}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </Link>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this job?")) {
                    handleStatusChange(job.id, "cancelled");
                  }
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                <MoreHorizontal className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Grid */}
      <div className="px-4 py-6">
        <div className=" mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Title & Location - Mobile optimized */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {job.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      {job.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      {job.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{formatDate(job.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {job.description}
                </p>

                {job.building_access && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">Building Access:</span>{" "}
                      {job.building_access}
                    </p>
                  </div>
                )}
              </div>

              {/* Job Details Grid - Responsive grid */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Job Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-500 mb-1">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs font-medium">PAY RATE</span>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                      {formatPrice(job)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-500 mb-1">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs font-medium">URGENCY</span>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {job.urgency || "Flexible"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-500 mb-1">
                      <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs font-medium">LEVEL</span>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {job.level_required || "Any"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-500 mb-1">
                      <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs font-medium">MATERIALS</span>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {job.materials_provided ? "Provided" : "Not Provided"}
                    </p>
                  </div>
                </div>

                {job.project_size && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">Project Size:</span>{" "}
                      {job.project_size}
                    </p>
                  </div>
                )}
              </div>

              {/* Evidence Photos - Responsive grid */}
              {job.images && job.images.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                    Evidence Photos
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3">
                    {job.images.map((img, index) => {
                      const imageUrl = getImageUrl(img);
                      const hasError = imageErrors[index];
                      const isLoading = !loadedImages[index] && !hasError;

                      return (
                        <div
                          key={index}
                          className="relative group cursor-pointer aspect-square bg-gray-100 rounded-lg border border-gray-200 overflow-hidden"
                          onClick={() =>
                            !hasError && setSelectedImage(imageUrl || undefined)
                          }
                        >
                          {imageUrl && !hasError ? (
                            <>
                              <img
                                src={imageUrl}
                                alt={`Job photo ${index + 1}`}
                                className={`w-full h-full object-cover transition-opacity duration-300 ${
                                  loadedImages[index]
                                    ? "opacity-100"
                                    : "opacity-0"
                                } group-hover:opacity-90`}
                                onLoad={() => handleImageLoad(index)}
                                onError={() =>
                                  handleImageError(index, imageUrl)
                                }
                              />
                              {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                              {loadedImages[index] && (
                                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <Eye className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-2">
                              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-2" />
                              <span className="text-xs text-gray-500 text-center">
                                Image not available
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Skills & Requirements */}
              {job.skills && job.skills.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                    Skills & Requirements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-[#E7ECF2] text-[#475569] rounded-2xl text-xs sm:text-sm  "
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* COI Document */}
              {job.coi_url && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                    Certificate of Insurance
                  </h3>
                  <a
                    href={job.coi_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <FileText className="w-4 h-4" />
                    View Document
                  </a>
                </div>
              )}
            </div>

            {/* Right Column - Applications & Job Status */}
            <div className="space-y-6">
              {/* Applications Section - Mobile scrollable */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Applicants Review ({applications.length})
                  </h3>
                  <Link
                    href={`/admin/jobs/${job.id}/applications`}
                    className="text-xs underline sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all
                  </Link>
                </div>

                <div className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1">
                  {applications.length > 0 ? (
                    applications.slice(0, 5).map((app) => (
                      <div
                        key={app.id}
                        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        {/* Avatar */}
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${getAvatarColor(
                            app.worker_id
                          )} flex-shrink-0 flex items-center justify-center text-white font-bold text-xs sm:text-sm`}
                        >
                          {app.worker?.avatar_url ? (
                            <img
                              src={app.worker.avatar_url}
                              alt={app.worker.full_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(app.worker?.full_name || "?")
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                              {app.worker?.full_name || "Unknown Worker"}
                            </h4>
                            {getApplicationStatusBadge(app.status)}
                          </div>
                          <p className="text-xs text-gray-500 mb-1 truncate">
                            {app.worker?.email || "No email"}
                          </p>
                          <p className="text-xs text-gray-400">
                            Applied {formatDate(app.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-xs sm:text-sm text-gray-500">
                        No applications yet
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Status Card - Responsive */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Job Status
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Status
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {getStatusIcon(job.status)}
                      <span className="hidden xs:inline">
                        {job.status === "open"
                          ? "Job Open"
                          : job.status.replace("_", " ")}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Posted by
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${getAvatarColor(
                          job.customer_id
                        )} flex items-center justify-center text-white text-xs font-medium`}
                      >
                        {getInitials(job.customer?.full_name || "U")}
                      </div>
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[150px]">
                          {job.customer?.full_name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[150px]">
                          {job.customer?.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Posted on
                    </span>
                    <span className="text-xs sm:text-sm text-gray-900 text-right">
                      {formatDateTime(job.created_at)}
                    </span>
                  </div>

                  {job.worker && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-500">
                        Assigned to
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${getAvatarColor(
                            job.worker_id || ""
                          )} flex items-center justify-center text-white text-xs font-medium`}
                        >
                          {getInitials(job.worker.full_name)}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {job.worker.full_name}
                        </span>
                      </div>
                    </div>
                  )}

                  {job.date && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-500">
                        Scheduled
                      </span>
                      <span className="text-xs sm:text-sm text-gray-900 text-right">
                        {new Date(job.date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 sm:pt-4 border-t border-gray-200">
                    <Link
                      href={`/admin/users/${job.customer_id}`}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>View customer profile</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Responsive buttons */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {job.status !== "completed" && job.status !== "cancelled" && (
                    <button
                      onClick={() => handleStatusChange(job.id, "completed")}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Mark Completed</span>
                    </button>
                  )}
                  {job.status !== "cancelled" && job.status !== "completed" && (
                    <button
                      onClick={() => handleStatusChange(job.id, "cancelled")}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Cancel Job</span>
                    </button>
                  )}
                  <button className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-50 transition flex items-center justify-center gap-2 text-xs sm:text-sm">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Report Issue</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal - Responsive */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-5xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size"
              className="w-full h-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white bg-black/50 rounded-full p-1 sm:p-2 hover:bg-black/70 transition"
            >
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
