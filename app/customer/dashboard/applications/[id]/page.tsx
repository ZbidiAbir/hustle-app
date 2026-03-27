"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  MoreVertical,
  Copy,
  AlertCircle,
  BadgeCheck,
  Briefcase,
  Star,
  Clock,
  MapPin,
  Calendar,
  MessageCircle,
  Award,
  Shield,
  ThumbsUp,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { Application } from "./types";
import { useDispute } from "./hooks/useDispute";
import { useFormatters } from "./hooks/useFormatters";
import { LoadingState } from "./components/shared/LoadingState";
import { ApplicationStatusBanner } from "./components/shared/application/ApplicationStatusBanner";
import { QuickActions } from "./components/shared/application/QuickActions";
import { Tabs } from "./components/shared/application/Tabs";
import { ProposalCard } from "./components/shared/application/ProposalCard";
import { JobDetailsCard } from "./components/shared/job/JobDetailsCard";
import { WorkerProfileCard } from "./components/shared/worker/WorkerProfileCard";
import { DisputeModal } from "./components/shared/dispute/DisputeModal";
import { useIconsAndBadges } from "./hooks/useIconsAndBadges";
import { WorkerActions } from "./components/shared/application/WorkerActions";
import { RatingSummary } from "./components/shared/rate/RatingSummary";
import { RateButton } from "./components/shared/rate/RateButton";

export default function ApplicationDetailPage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false); // Ajouté
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false); // Ajouté
  const [selectedAction, setSelectedAction] = useState<
    "accept" | "reject" | null
  >(null); // Ajouté
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [completedJobsCount, setCompletedJobsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"proposal" | "job" | "worker">(
    "proposal"
  );
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const applicationId = params.id as string;

  const dispute = useDispute(application?.job_id, currentUser?.id);
  const { formatCurrency } = useFormatters();

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Check if user has rated this job
  const checkIfHasRated = useCallback(async () => {
    if (!application?.job_id || !currentUser?.id) return;

    try {
      const { data: existingRate, error } = await supabase
        .from("rates")
        .select("id")
        .eq("job_id", application.job_id)
        .eq("reviewer_id", currentUser.id)
        .maybeSingle();

      console.log("Check rating result:", { existingRate, error });
      setHasRated(!!existingRate);
    } catch (error) {
      console.error("Error checking rating status:", error);
      setHasRated(false);
    }
  }, [application?.job_id, currentUser?.id]);

  // Fetch application details
  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);

      const { data: appData, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicationId)
        .single();
      if (appError) throw appError;

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", appData.job_id)
        .single();
      if (jobError) throw jobError;

      const { data: workerData, error: workerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", appData.worker_id)
        .single();
      if (workerError) throw workerError;

      const { count, error: countError } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("worker_id", appData.worker_id)
        .eq("status", "completed");
      if (countError) throw countError;

      console.log("Job status:", jobData.status);

      setCompletedJobsCount(count || 0);
      setApplication({ ...appData, job: jobData, worker: workerData });
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [applicationId]);

  useEffect(() => {
    if (application && currentUser) {
      checkIfHasRated();
    }
  }, [application, currentUser, checkIfHasRated]);
  const handleAccept = async () => {
    if (!application) return;

    try {
      setStatusChanging(true);

      const { data, error: rpcError } = await supabase.rpc(
        "accept_application_safe",
        {
          p_application_id: application.id,
          p_job_id: application.job_id,
          p_worker_id: application.worker_id,
        }
      );

      if (rpcError) {
        console.error("RPC error:", rpcError);
        toast.error("Failed to accept application");
        throw rpcError;
      }

      if (data && !data.success) {
        toast.error(data.error || "Failed to accept application");
        throw new Error(data.error);
      }

      setApplication({
        ...application,
        status: "accepted",
        job: application.job
          ? {
              ...application.job,
              status: "assigned",
              //@ts-ignore
              worker_id: application.worker_id,
            }
          : undefined,
      });

      toast.success("✅ Application accepted!");
      await fetchApplicationDetails();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to accept application");
    } finally {
      setStatusChanging(false);
    }
  };
  const handleReject = async () => {
    if (!application) return;

    try {
      setStatusChanging(true);

      // Appeler la fonction RPC pour le rejet
      // ✅ NOUVEAU CODE
      const { data, error: rpcError } = await supabase.rpc(
        "accept_application_simple", // ← Bonne fonction
        {
          p_application_id: application.id,
          p_job_id: application.job_id,
          p_worker_id: application.worker_id,
        }
      );
      if (rpcError) {
        console.error("RPC error:", rpcError);
        toast.error("Failed to reject application");
        throw rpcError;
      }

      if (data && !data.success) {
        toast.error(data.error || "Failed to reject application");
        throw new Error(data.error);
      }

      // Mettre à jour l'état local
      setApplication({
        ...application,
        status: "rejected",
      });

      toast.success("✅ Application rejected successfully");

      // Rediriger vers la liste des applications
      router.push(`/customer/dashboard/applications`);
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    } finally {
      setStatusChanging(false);
      setShowRejectConfirm(false);
    }
  };

  const handleContact = useCallback(() => {
    if (!application) return;
    router.push(
      `/customer/dashboard/chat/${application.job_id}?worker=${application.worker_id}`
    );
  }, [application, router]);

  const handleViewJob = useCallback(() => {
    if (!application) return;
    router.push(`/customer/job/${application.job_id}`);
  }, [application, router]);

  const handleOpenDisputeModal = async () => {
    await dispute.fetchExistingDispute();
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async () => {
    if (!application) return;
    const success = await dispute.submitDispute(
      //@ts-ignore
      application.worker_id
    );
    if (success) {
      setShowDisputeModal(false);
    }
  };

  const handleUpdateDispute = async () => {
    const success = await dispute.updateDispute();
    if (success) {
      setShowDisputeModal(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share?.({
        title: `Application from ${application?.worker?.full_name}`,
        text: `Check out this application for ${application?.job?.title}`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
    setIsShareOpen(false);
  };

  const handleRatingSuccess = () => {
    toast.success("Thank you for your rating!");
    setHasRated(true);
    fetchApplicationDetails();
  };

  if (loading) return <LoadingState />;

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The application you're looking for doesn't exist or has been
            removed.
          </p>
          <Link
            href="/customer/all-applications"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-lg hover:from-purple-700 hover:to-purple-700 transition shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition group"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              </button>
              <nav className="hidden sm:flex items-center space-x-2 text-sm">
                <Link
                  href="/"
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  Home
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <Link
                  href="/customer/all-applications"
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  Applications
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {application.worker?.full_name}
                </span>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-lg transition relative group ${
                  isFavorite
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsShareOpen(!isShareOpen)}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {isShareOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border py-1 z-50">
                    <button
                      onClick={handleShare}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" /> Share via...
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied!");
                        setIsShareOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> Copy link
                    </button>
                  </div>
                )}
              </div>

              <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationStatusBanner
          status={application.status}
          onContact={handleContact}
        />
        <QuickActions
          onMessage={handleContact}
          onViewJob={handleViewJob}
          phone={application.worker?.phone}
        />
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "proposal" && (
              <>
                <ProposalCard application={application} />
                {application.job && <JobDetailsCard job={application.job} />}
              </>
            )}
            {activeTab === "job" && application.job && (
              <JobDetailsCard job={application.job} expanded />
            )}
            {activeTab === "worker" && application.worker && (
              <WorkerProfileCard
                worker={application.worker}
                completedJobsCount={completedJobsCount}
                showAllDetails={showAllDetails}
                onToggleDetails={() => setShowAllDetails(!showAllDetails)}
                onFileDispute={handleOpenDisputeModal}
                existingDisputeStatus={dispute.existingDisputeStatus}
              />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <WorkerSummaryCard
              worker={application.worker}
              completedJobsCount={completedJobsCount}
              onContact={handleContact}
              onViewJob={handleViewJob}
              onDispute={handleOpenDisputeModal}
              isUpdatingDispute={dispute.isUpdating}
              existingDisputeStatus={dispute.existingDisputeStatus}
              applicationStatus={application.status}
              jobStatus={application.job?.status}
              onAccept={handleAccept}
              onReject={handleReject}
              processing={processing || statusChanging}
              showRejectConfirm={showRejectConfirm}
              setShowRejectConfirm={setShowRejectConfirm}
              jobId={application.job_id}
              workerId={application.worker_id}
              workerName={application.worker?.full_name || "the worker"}
              jobTitle={application.job?.title || "this job"}
              hasRated={hasRated}
              onRatingSuccess={handleRatingSuccess}
            />
          </div>
        </div>
      </main>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <DisputeModal
          workerName={application.worker?.full_name || "the worker"}
          jobTitle={application.job?.title || "this job"}
          disputeType={dispute.disputeType}
          setDisputeType={dispute.setDisputeType}
          disputeDescription={dispute.disputeDescription}
          setDisputeDescription={dispute.setDisputeDescription}
          preferredResolution={dispute.preferredResolution}
          setPreferredResolution={dispute.setPreferredResolution}
          evidenceFiles={dispute.evidenceFiles}
          evidenceUrls={dispute.evidenceUrls}
          onUploadEvidence={dispute.uploadEvidence}
          onRemoveEvidence={dispute.removeEvidence}
          uploadingEvidence={dispute.uploadingEvidence}
          submittingDispute={dispute.submittingDispute}
          onSubmit={
            dispute.isUpdating ? handleUpdateDispute : handleSubmitDispute
          }
          onClose={() => setShowDisputeModal(false)}
          isUpdating={dispute.isUpdating}
          existingDisputeStatus={dispute.existingDisputeStatus}
        />
      )}
    </div>
  );
}

// Composant pour la carte résumé du worker - Version améliorée
function WorkerSummaryCard({
  worker,
  completedJobsCount,
  onContact,
  onViewJob,
  onDispute,
  isUpdatingDispute,
  existingDisputeStatus,
  applicationStatus,
  jobStatus,
  onAccept,
  onReject,
  processing,
  showRejectConfirm,
  setShowRejectConfirm,
  jobId,
  workerId,
  workerName,
  jobTitle,
  hasRated,
  onRatingSuccess,
}: any) {
  const { getTradeCategoryIcon } = useIconsAndBadges();

  const getMemberSince = () => {
    if (worker?.created_at) {
      const date = new Date(worker.created_at);
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    return "Recently";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24 transition-all duration-300 hover:shadow-xl">
      {/* Header avec gradient et animation */}
      <div className="relative p-6 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-4 border-white/50 overflow-hidden shadow-lg">
              {worker?.avatar_url ? (
                <img
                  src={worker.avatar_url}
                  alt={worker.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                worker?.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            {worker?.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                <BadgeCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            {worker?.level === "master" && (
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                <Award className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate mb-1">
              {worker?.full_name}
            </h3>
            <p className="text-purple-100 text-sm flex items-center gap-1.5 mb-2">
              {getTradeCategoryIcon(worker?.trade_category)}
              <span>{worker?.job_title || "Professional"}</span>
              {worker?.level && (
                <>
                  <span className="w-1 h-1 bg-purple-300 rounded-full"></span>
                  <span className="capitalize">{worker.level}</span>
                </>
              )}
              {worker?.insured && (
                <>
                  <span className="w-1 h-1 bg-purple-300 rounded-full"></span>
                  <Shield className="w-3 h-3" />
                  <span>Insured</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-3 text-xs text-purple-200">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{worker?.city || "Location not specified"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Member since {getMemberSince()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5">
        {/* Stats avec animations */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="group relative text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-200 cursor-default">
            <div className="text-2xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform">
              {completedJobsCount}
            </div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Briefcase className="w-3 h-3" /> Jobs Completed
            </div>
          </div>
          <div className="group relative text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-200 cursor-default">
            <div className="text-2xl font-bold text-gray-900 mb-1 group-hover:scale-110 transition-transform">
              {worker?.response_rate || "100"}%
            </div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <MessageCircle className="w-3 h-3" /> Response Rate
            </div>
          </div>
        </div>

        {/* Badges de compétences */}
        {worker?.skills && worker.skills.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Skills & Expertise
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {worker.skills.slice(0, 3).map((skill: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-lg border border-purple-100"
                >
                  {skill}
                </span>
              ))}
              {worker.skills.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                  +{worker.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Rating Summary Component avec animation */}
        {worker?.id && (
          <div className="mb-5 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Worker Rating
              </h4>
            </div>
            <RatingSummary userId={worker.id} showDetails={true} />
          </div>
        )}

        {/* Rate Button avec animation */}
        {jobStatus === "completed" && (
          <div className="mb-4 animate-slideUp">
            <RateButton
              jobId={jobId}
              workerId={workerId}
              workerName={workerName}
              jobTitle={jobTitle}
              jobStatus={jobStatus}
              hasRated={hasRated}
              onRatingSuccess={onRatingSuccess}
            />
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 my-4"></div>

        {/* Worker Actions */}
        <WorkerActions
          status={applicationStatus}
          onAccept={onAccept}
          onReject={onReject}
          processing={processing}
          showRejectConfirm={showRejectConfirm}
          setShowRejectConfirm={setShowRejectConfirm}
          onContact={onContact}
          onViewJob={onViewJob}
          onDispute={onDispute}
          isUpdatingDispute={isUpdatingDispute}
          existingDisputeStatus={existingDisputeStatus}
        />
      </div>
    </div>
  );
}
