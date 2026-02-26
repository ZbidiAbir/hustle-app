"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { notifyNewApplication } from "@/lib/notifications";
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  Clock,
  Star,
  Award,
  X,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  images: string[];
  created_at: string;
  customer_id: string;
  status: string;
  level_required?: string;
  urgency?: string;
  project_size?: string;
};

type Customer = {
  full_name: string;
  email: string;
  avatar_url?: string;
  rating?: number;
  jobs_posted?: number;
  member_since?: string;
};

type Application = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  created_at: string;
};

export default function WorkerJobDetailPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const toast = useToast(); // 👈 Utilisation du hook

  useEffect(() => {
    fetchJobDetails();
  }, []);

  const fetchJobDetails = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();

      if (jobError) throw jobError;
      if (!jobData) {
        router.push("/worker/jobs");
        return;
      }

      setJob(jobData);

      // Fetch customer info
      const { data: customerData } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", jobData.customer_id)
        .maybeSingle();

      setCustomer({
        ...customerData,
        full_name: customerData?.full_name || "Client",
        email: customerData?.email || "",
        rating: 4.8,
        jobs_posted: 24,
        member_since: new Date(jobData.created_at).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });

      // Check if user has already applied
      if (user) {
        const { data: appData } = await supabase
          .from("applications")
          .select("id, status, message, created_at")
          .eq("job_id", jobId)
          .eq("worker_id", user.id)
          .maybeSingle();

        if (appData) {
          setApplication(appData);
          setApplicationMessage(appData.message || "");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      router.push("/worker/jobs");
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  const handleApply = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setApplying(true);

    try {
      // Insert application with message
      const { error } = await supabase.from("applications").insert([
        {
          job_id: jobId,
          worker_id: user.id,
          message: applicationMessage.trim(),
          status: "pending",
        },
      ]);

      if (error) throw error;

      // Get worker name for notification
      const { data: workerData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const workerName =
        workerData?.full_name || user.email?.split("@")[0] || "A worker";

      // Send notification to customer
      if (job && customer) {
        await notifyNewApplication(
          job.customer_id,
          job.title,
          workerName,
          jobId
        );
      }

      alert("✅ Application submitted successfully!");
      fetchJobDetails();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setApplying(false);
    }
  }, [jobId, applicationMessage, job, customer, router, fetchJobDetails]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "pending":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Pending Review
          </div>
        );
      case "accepted":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Accepted
          </div>
        );
      case "rejected":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejected
          </div>
        );
      default:
        return null;
    }
  }, []);

  const getAvatarColor = useCallback((id: string) => {
    const colors = [
      "from-purple-500 to-purple-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-red-500 to-red-600",
      "from-yellow-500 to-yellow-600",
      "from-pink-500 to-pink-600",
    ];
    const index = parseInt(id?.charAt(0) || "0", 16) % colors.length;
    return colors[index];
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Job Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/worker/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/worker/jobs"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Job Details
              </h1>
              <p className="text-sm text-gray-500">{job.category}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Images */}
              {job.images && job.images.length > 0 && (
                <div className="relative">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-gray-50">
                    {job.images.slice(0, 4).map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedImage(img)}
                      >
                        <img
                          src={img}
                          alt={`Job photo ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:opacity-90 transition"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Title and Price */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {job.title}
                  </h2>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600">
                      ${job.price}
                    </div>
                    <div className="text-xs text-gray-500">Fixed price</div>
                  </div>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-xs">CATEGORY</span>
                    </div>
                    <p className="font-medium text-gray-900">{job.category}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs">LOCATION</span>
                    </div>
                    <p className="font-medium text-gray-900">{job.location}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">POSTED</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">URGENCY</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {job.urgency || "Flexible"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Description
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Additional Details */}
                {(job.level_required || job.project_size) && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Additional Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {job.level_required && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Level Required
                          </p>
                          <p className="font-medium text-gray-900">
                            {job.level_required}
                          </p>
                        </div>
                      )}
                      {job.project_size && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Project Size
                          </p>
                          <p className="font-medium text-gray-900">
                            {job.project_size}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Customer & Application */}
          <div className="space-y-6">
            {/* Customer Card */}
            {customer && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
                <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-purple-600">
                  <h3 className="text-lg font-semibold text-white">Client</h3>
                </div>

                <div className="p-6">
                  {/* Customer Profile */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-r ${getAvatarColor(
                        job.customer_id
                      )} flex items-center justify-center text-white font-bold text-2xl shadow-md`}
                    >
                      {customer.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {customer.full_name}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {customer.rating}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({customer.jobs_posted} jobs)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span>Member since {customer.member_since}</span>
                    </div>
                  </div>

                  {/* Application Status */}
                  {application && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Application Status
                      </p>
                      {getStatusBadge(application.status)}

                      {/* Display application message if exists */}
                      {application.message && (
                        <div className="mt-3 p-3 bg-white rounded-lg border-l-2 border-purple-500">
                          <p className="text-sm text-gray-600 italic">
                            "{application.message}"
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        Applied on{" "}
                        {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Apply Form - WITH TEXTAREA */}
                  {!application ? (
                    <div className="space-y-4">
                      {/* Message Textarea - This is what you asked for! */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message to Client{" "}
                          <span className="text-gray-400">(Optional)</span>
                        </label>
                        <textarea
                          value={applicationMessage}
                          onChange={(e) =>
                            setApplicationMessage(e.target.value)
                          }
                          placeholder="Introduce yourself and explain why you're a good fit for this job. Share your relevant experience and skills..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          rows={4}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {applicationMessage.length}/500 characters
                        </p>
                      </div>

                      {/* Apply Button */}
                      <button
                        onClick={handleApply}
                        disabled={applying}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-lg hover:from-purple-700 hover:to-purple-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {applying ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Apply Now
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* After Application - Show Chat Button */
                    <div className="flex gap-2">
                      <Link
                        href={`/worker/dashboard/chat/${job.id}`}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-5 h-5" />
                        Chat with Client
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
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
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
