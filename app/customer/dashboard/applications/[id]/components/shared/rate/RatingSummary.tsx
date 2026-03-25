"use client";

import { Star, Award, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface RatingSummaryProps {
  userId: string;
  showDetails?: boolean;
}

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
}

export function RatingSummary({
  userId,
  showDetails = false,
}: RatingSummaryProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatingStats();
  }, [userId]);

  const fetchRatingStats = async () => {
    try {
      setLoading(true);

      const { data: ratings, error } = await supabase
        .from("rates")
        .select("rating")
        .eq("reviewee_id", userId);

      if (error) throw error;

      const totalRatings = ratings?.length || 0;
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings?.forEach((r) => {
        distribution[r.rating as keyof typeof distribution]++;
      });

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

      setStats({
        averageRating,
        totalRatings,
        isEstablished,
        displayedRating,
        statusText,
        ratingDistribution: distribution,
      });
    } catch (error) {
      console.error("Error fetching rating stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!stats || stats.totalRatings === 0) {
    return <div></div>;
  }

  return (
    <div className="space-y-3">
      {/* Main Rating Display */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        <div className="text-center min-w-[70px]">
          {stats.isEstablished ? (
            <>
              <div className="text-2xl font-bold text-gray-900">
                {stats.displayedRating}
              </div>
              <div className="flex items-center gap-0.5 justify-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= Math.round(stats.displayedRating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-gray-900">
                {stats.statusText}
              </div>
              <div className="text-xs text-gray-500">
                {stats.totalRatings} rating{stats.totalRatings !== 1 ? "s" : ""}
              </div>
            </>
          )}
        </div>

        <div className="flex-1">
          <div className="text-xs text-gray-600">
            {stats.isEstablished ? (
              <>
                <span className="font-medium">{stats.displayedRating}</span> out
                of 5<span className="mx-1">•</span>
                {stats.totalRatings} rating{stats.totalRatings !== 1 ? "s" : ""}
              </>
            ) : (
              <>
                {stats.totalRatings} rating{stats.totalRatings !== 1 ? "s" : ""}
                <span className="mx-1">•</span>
                Need {5 - stats.totalRatings} more
              </>
            )}
          </div>
          {stats.totalRatings >= 10 && (
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>Lowest rating excluded</span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Rating Distribution */}
      {showDetails && stats.totalRatings > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Distribution</h4>
          {[5, 4, 3, 2, 1].map((star) => {
            const count =
              stats.ratingDistribution[
                star as keyof typeof stats.ratingDistribution
              ];
            const percentage =
              stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-2">
                <div className="w-8 text-xs text-gray-600">{star}★</div>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-gray-600 text-right">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Badge for New/Establishing */}
      {!stats.isEstablished && stats.totalRatings > 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
          <Award className="w-3 h-3 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            {5 - stats.totalRatings} more rating
            {5 - stats.totalRatings !== 1 ? "s" : ""} to show score
          </p>
        </div>
      )}
    </div>
  );
}
