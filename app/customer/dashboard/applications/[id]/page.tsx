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
  Star,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  ArrowLeft,
  AlertCircle,
  User,
  Mail,
  Phone,
  Shield,
  Award,
  ThumbsUp,
} from "lucide-react";
import {
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyJobStatusChanged,
} from "@/lib/notifications";
import { useToast } from "@/contexts/ToastContext";

type Application = {
  id: string;
  job_id: string;
  worker_id: string;
  message: string;
  status: string;
  created_at: string;
  job?: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    location: string;
    status: string;
    created_at: string;
    images?: string[];
  };
  worker?: {
    full_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
    profession?: string;
    rating?: number;
    reviews_count?: number;
    jobs_completed?: number;
    verified?: boolean;
    member_since?: string;
    skills?: string[];
  };
};

export default function ApplicationDetailPage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const applicationId = params.id as string;

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
    fetchApplicationDetails();
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);

      // 1. Récupérer l'application
      const { data: appData, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (appError) throw appError;

      // 2. Récupérer les détails du job
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", appData.job_id)
        .single();

      if (jobError) throw jobError;

      // 3. Récupérer les détails du worker
      const { data: workerData, error: workerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", appData.worker_id)
        .single();

      if (workerError) throw workerError;

      setApplication({
        ...appData,
        job: jobData,
        worker: {
          ...workerData,
          profession: workerData.profession || "Professional",
          rating: workerData.rating || 4.8,
          reviews_count: workerData.reviews_count || 193,
          jobs_completed: workerData.jobs_completed || 78,
          verified: workerData.verified || true,
          member_since: workerData.created_at || new Date().toISOString(),
          skills: workerData.skills || [
            "Emergency Plumbing",
            "Pipe Repair",
            "Fixture Installation",
          ],
        },
      });
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!application) return;

    setProcessing(true);
    try {
      // 1. Accepter cette candidature
      const { error: acceptError } = await supabase
        .from("applications")
        .update({ status: "accepted" })
        .eq("id", application.id);

      if (acceptError) throw acceptError;

      // 2. Rejeter les autres candidatures pour ce job
      const { error: rejectError } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("job_id", application.job_id)
        .neq("id", application.id);

      if (rejectError) throw rejectError;

      // 3. Mettre à jour le job
      const { error: jobError } = await supabase
        .from("jobs")
        .update({
          worker_id: application.worker_id,
          status: "assigned",
        })
        .eq("id", application.job_id);

      if (jobError) throw jobError;

      // 🔔 NOTIFICATION 1: Au worker accepté
      await notifyApplicationAccepted(
        application.worker_id,
        application.job?.title || "a job",
        application.job_id,
        currentUser?.user_metadata?.full_name || "A client"
      );

      // 🔔 NOTIFICATION 2: Notification de changement de statut
      await notifyJobStatusChanged(
        application.worker_id,
        application.job?.title || "a job",
        "assigned",
        application.job_id,
        "worker"
      );

      toast.success("✅ Application accepted successfully!");
      toast.info(`Notification sent to ${application.worker?.full_name}`);

      router.push(`/customer/dashboard/applications`);
    } catch (error: any) {
      console.error("Error accepting application:", error);
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", application.id);

      if (error) throw error;

      // 🔔 NOTIFICATION: Au worker refusé
      await notifyApplicationRejected(
        application.worker_id,
        application.job?.title || "a job",
        application.job_id
      );

      toast.success("✅ Application rejected");
      toast.info(`Notification sent to ${application.worker?.full_name}`);

      router.push(`/customer/dashboard/applications`);
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setProcessing(false);
      setShowRejectConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The application you're looking for doesn't exist.
          </p>
          <Link
            href="/customer/all-applications"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/customer/all-applications"
            className="text-gray-500 hover:text-gray-700"
          >
            Applications
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">
            Application from {application.worker?.full_name}
          </span>
        </div>

        {/* Header with actions */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Review Application
            </h1>
            <p className="text-gray-600 mt-1">
              Review {application.worker?.full_name}'s proposal for "
              {application.job?.title}"
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/customer/job/${application.job_id}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              View Job
            </Link>
            <Link
              href={`/customer/dashboard/chat/${application.job_id}?worker=${application.worker_id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Message Worker
            </Link>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Application details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Worker Proposal Card */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b bg-linear-to-r from-gray-50 to-white">
                <h2 className="text-lg font-semibold text-gray-900">
                  Worker's Proposal
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {application.message || "No message provided."}
                </p>

                {/* Time and Rate Table */}
                <div className="mt-6 bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="font-medium text-gray-700">Time window</div>
                    <div className="font-medium text-gray-700">Rate</div>

                    <div className="flex items-center gap-2 text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      Wed 2PM-4PM
                    </div>
                    <div>
                      <span className="text-xl font-bold text-gray-900">
                        ${application.job?.price || 280}
                      </span>
                      <span className="text-gray-500 ml-1">+$100</span>
                      <p className="text-xs text-gray-500 mt-1">
                        includes materials
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Card */}
            {application.job && (
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-linear-to-r from-gray-50 to-white">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Job Details
                  </h2>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {application.job.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {application.job.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Category</p>
                      <p className="font-medium text-gray-900">
                        {application.job.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Budget</p>
                      <p className="font-medium text-gray-900">
                        ${application.job.price}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Location</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {application.job.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Posted on</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(application.job.created_at)}
                      </p>
                    </div>
                  </div>

                  {application.job.images &&
                    application.job.images.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">Job photos</p>
                        <div className="flex gap-2">
                          {application.job.images.slice(0, 3).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Job ${i + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Worker Profile & Actions */}
          <div className="space-y-6">
            {/* Worker Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden sticky top-24">
              <div className="p-6 border-b bg-linear-to-r from-blue-600 to-purple-600 text-white">
                <h2 className="text-lg font-semibold">Worker Profile</h2>
              </div>

              <div className="p-6">
                {/* Worker Header */}
                <div className="text-center mb-6">
                  {/* Avatar */}
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-linear-to-r from-blue-500 to-purple-500 mx-auto flex items-center justify-center text-white font-bold text-3xl mb-3 border-4 border-white shadow-lg">
                      {application.worker?.avatar_url ? (
                        <img
                          src={application.worker.avatar_url}
                          alt={application.worker.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        application.worker?.full_name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    {application.worker?.verified && (
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900">
                    {application.worker?.full_name}
                  </h3>
                  <p className="text-gray-600">
                    {application.worker?.profession}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold ml-1">
                        {application.worker?.rating}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                      {application.worker?.reviews_count} reviews
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <Briefcase className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">
                      {application.worker?.jobs_completed}
                    </p>
                    <p className="text-xs text-gray-500">Jobs Done</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <MapPin className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">2.3</p>
                    <p className="text-xs text-gray-500">km away</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {application.worker?.email}
                    </span>
                  </div>
                  {application.worker?.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {application.worker.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Member since{" "}
                      {formatDate(application.worker?.member_since || "")}
                    </span>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {application.worker?.skills?.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Application Status */}
                {application.status !== "pending" && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Current Status
                    </p>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
                        application.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {application.status === "accepted" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {application.status === "accepted"
                          ? "Accepted"
                          : "Rejected"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {application.status === "pending" ? (
                    <>
                      <button
                        onClick={handleAccept}
                        disabled={processing}
                        className="w-full py-3 bg-linear-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Accept Application
                          </>
                        )}
                      </button>

                      {!showRejectConfirm ? (
                        <button
                          onClick={() => setShowRejectConfirm(true)}
                          disabled={processing}
                          className="w-full py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition font-medium flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject Application
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-red-600 text-center">
                            Are you sure you want to reject this application?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowRejectConfirm(false)}
                              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleReject}
                              disabled={processing}
                              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
