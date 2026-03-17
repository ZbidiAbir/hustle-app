import { useState, useEffect } from "react";
import {
  WorkerDetails,
  WorkerReview,
  WorkerPortfolio,
  WorkerCertification,
} from "@/types/worker";
import { workerService } from "../workerService";

export const useWorkerDetails = (workerId: string) => {
  const [worker, setWorker] = useState<WorkerDetails | null>(null);
  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [portfolio, setPortfolio] = useState<WorkerPortfolio[]>([]);
  const [certifications, setCertifications] = useState<WorkerCertification[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "about" | "reviews" | "portfolio" | "certifications"
  >("about");

  useEffect(() => {
    if (workerId) {
      loadWorkerDetails();
    }
  }, [workerId]);

  const loadWorkerDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const [workerData, reviewsData, portfolioData, certificationsData] =
        await Promise.all([
          workerService.getWorkerDetails(workerId),
          workerService.getWorkerReviews(workerId),
          workerService.getWorkerPortfolio(workerId),
          workerService.getWorkerCertifications(workerId),
        ]);

      if (workerData) {
        setWorker(workerData);
        setReviews(reviewsData);
        setPortfolio(portfolioData);
        setCertifications(certificationsData);
      } else {
        setError("Worker non trouvé");
      }
    } catch (err) {
      setError("Erreur lors du chargement des détails du worker");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (date: string) => {
    return await workerService.checkAvailability(workerId, date);
  };

  const refreshReviews = async () => {
    const newReviews = await workerService.getWorkerReviews(workerId);
    setReviews(newReviews);
  };

  return {
    worker,
    reviews,
    portfolio,
    certifications,
    loading,
    error,
    activeTab,
    setActiveTab,
    checkAvailability,
    refreshReviews,
  };
};
