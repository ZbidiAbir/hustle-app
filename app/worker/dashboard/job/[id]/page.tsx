"use client";

import { useParams } from "next/navigation";

import { Shield } from "lucide-react";
import { useJobDetail } from "@/lib/hooks/useJobDetail";
import { LoadingState } from "./components/LoadingState";
import { getDisplayPrice } from "@/utils/jobDetail.utils";
import { JobHeader } from "./components/JobHeader";
import { JobImages } from "./components/JobImages";
import { JobDetails } from "./components/JobDetails";
import { JobSpecifications } from "./components/JobSpecifications";
import { JobSchedule } from "./components/JobSchedule";
import { JobSkills } from "./components/JobSkills";
import { JobDescription } from "./components/JobDescription";
import { CustomerCard } from "./components/CustomerCard";
import { ApplicationStatus } from "./components/ApplicationStatus";
import { ApplicationForm } from "./components/ApplicationForm";
import { ChatButton } from "./components/ChatButton";
import { ImageModal } from "./components/ImageModal";

export default function WorkerJobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const {
    job,
    customer,
    application,
    loading,
    applying,
    applicationMessage,
    selectedImage,
    setApplicationMessage,
    setSelectedImage,
    handleApply,
  } = useJobDetail(jobId);

  if (loading) {
    return <LoadingState />;
  }

  if (!job || !customer) {
    return null; // La redirection est gérée dans le hook
  }

  const displayPrice = getDisplayPrice(job);

  return (
    <div className="min-h-screen bg-gray-50">
      <JobHeader category={job.category} />

      <div className="px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <JobImages images={job.images} onImageClick={setSelectedImage} />
              <JobDetails job={job} displayPrice={displayPrice} />
              <div className="px-6 pb-6">
                <JobSpecifications job={job} />
                <JobSchedule job={job} />
                <JobSkills skills={job.skills || []} />
                <JobDescription description={job.description} />

                {/* Insurance/COI */}
                {job.coi_url && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>Certificate of Insurance available</span>
                      <a
                        href={job.coi_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 font-medium ml-2"
                      >
                        View
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Customer & Application */}
          <div className="space-y-6">
            <CustomerCard
              customer={customer}
              customerId={job.customer_id}
              jobId={job.id}
              applicationStatus={
                application ? (
                  <ApplicationStatus application={application} />
                ) : undefined
              }
              applicationForm={
                !application ? (
                  <ApplicationForm
                    message={applicationMessage}
                    onMessageChange={setApplicationMessage}
                    onSubmit={handleApply}
                    isSubmitting={applying}
                  />
                ) : undefined
              }
              chatButton={
                application ? <ChatButton jobId={job.id} /> : undefined
              }
            />
          </div>
        </div>
      </div>

      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
