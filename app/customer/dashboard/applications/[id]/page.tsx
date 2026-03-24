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

export default function ApplicationDetailPage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [completedJobsCount, setCompletedJobsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"proposal" | "job" | "worker">(
    "proposal"
  );
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

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

  // Actions
  const handleAccept = async () => {
    if (!application) return;
    setProcessing(true);
    try {
      await supabase
        .from("applications")
        .update({ status: "accepted" })
        .eq("id", application.id);
      await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("job_id", application.job_id)
        .neq("id", application.id);
      await supabase
        .from("jobs")
        .update({ worker_id: application.worker_id, status: "assigned" })
        .eq("id", application.job_id);
      toast.success("Application accepted successfully!");
      router.push(`/customer/dashboard/applications`);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    setProcessing(true);
    try {
      await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", application.id);
      toast.success("Application rejected");
      router.push(`/customer/dashboard/applications`);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
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
    const success = await dispute.submitDispute(application.worker_id);
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

  // Loading state
  if (loading) return <LoadingState />;

  // Error state
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              status={application.status}
              onAccept={handleAccept}
              onReject={handleReject}
              processing={processing}
              showRejectConfirm={showRejectConfirm}
              setShowRejectConfirm={setShowRejectConfirm}
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

// Composant pour la carte résumé du worker
function WorkerSummaryCard({
  worker,
  completedJobsCount,
  onContact,
  onViewJob,
  onDispute,
  isUpdatingDispute,
  existingDisputeStatus,
  status,
  onAccept,
  onReject,
  processing,
  showRejectConfirm,
  setShowRejectConfirm,
}: any) {
  const { formatCurrency } = useFormatters();
  const { getTradeCategoryIcon } = useIconsAndBadges();

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden sticky top-24">
      <div className="p-6 bg-gradient-to-r from-purple-600 to-purple-600">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white overflow-hidden backdrop-blur-sm">
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
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {worker?.full_name}
            </h3>
            <p className="text-purple-100 text-sm flex items-center gap-1">
              {getTradeCategoryIcon(worker?.trade_category)}
              {worker?.job_title || "Professional"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">
              {completedJobsCount}
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
              <Briefcase className="w-3 h-3" /> Jobs Done
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">
              {worker?.rating?.toFixed(1) || "New"}
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
              <Star className="w-3 h-3" /> Rating
            </div>
          </div>
        </div>

        <WorkerActions
          status={status}
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
