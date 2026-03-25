"use client";

import { useState } from "react";
import { Star, X, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RateModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  workerId: string;
  workerName: string;
  jobTitle: string;
  onSuccess?: () => void;
}

export function RateModal({
  isOpen,
  onClose,
  jobId,
  workerId,
  workerName,
  jobTitle,
  onSuccess,
}: RateModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if user has already rated this job
      const { data: existingRate, error: checkError } = await supabase
        .from("rates")
        .select("id")
        .eq("job_id", jobId)
        .eq("reviewer_id", user.id)
        .single();

      if (existingRate) {
        setError("You have already rated this job");
        return;
      }

      // Insert the rating
      const { error: insertError } = await supabase.from("rates").insert({
        job_id: jobId,
        reviewer_id: user.id,
        reviewee_id: workerId,
        rating: rating,
        review_text: reviewText.trim() || null,
        category: "worker",
      });

      if (insertError) throw insertError;

      // Call success callback
      onSuccess?.();
      onClose();

      // Reset form
      setRating(0);
      setReviewText("");
      setError("");
    } catch (err: any) {
      console.error("Error submitting rating:", err);
      setError(err.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const ratingLabels = {
    1: "Poor - Not satisfied",
    2: "Fair - Could be better",
    3: "Good - Satisfactory",
    4: "Very Good - Impressed",
    5: "Excellent - Outstanding work!",
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Rate Worker</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Job Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">Rating for job:</p>
            <p className="font-semibold text-gray-900">{jobTitle}</p>
            <p className="text-sm text-gray-600 mt-2">
              Worker: <span className="font-medium">{workerName}</span>
            </p>
          </div>

          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Rating *
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transform transition hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    } transition`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {rating === 0
                ? "Select a rating"
                : ratingLabels[rating as keyof typeof ratingLabels]}
            </p>
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Write a Review (Optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this worker..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {reviewText.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Your rating helps other customers make informed decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
