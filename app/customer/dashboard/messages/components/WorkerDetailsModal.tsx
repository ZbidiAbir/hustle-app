// components/WorkerDetailsModal.tsx
import {
  X,
  Star,
  MapPin,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Award,
  CheckCircle,
  Clock,
  ThumbsUp,
  MessageCircle,
  User,
  Building2,
  GraduationCap,
  BadgeCheck,
} from "lucide-react";
import { Profile } from "@/types/profile";
import { Conversation } from "@/types/messages.types";
import { useEffect, useState } from "react";
import { workerService } from "../worker.service";

interface WorkerDetailsModalProps {
  worker: Profile;
  job: Conversation;
  onClose: () => void;
}

interface WorkerStats {
  jobs_completed: number;
  rating: number;
  reviews_count: number;
  response_rate: number;
  member_since: string;
}

interface WorkExperience {
  id: string;
  company_name: string;
  position: string;
  location: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
  description: string;
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  reviewer: {
    full_name: string;
    avatar_url: string;
  };
}

export const WorkerDetailsModal: React.FC<WorkerDetailsModalProps> = ({
  worker,
  job,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [workerDetails, setWorkerDetails] = useState<{
    profile: Profile;
    stats: WorkerStats;
    recent_reviews: Review[];
    work_experience: WorkExperience[];
  } | null>(null);

  useEffect(() => {
    const fetchWorkerDetails = async () => {
      try {
        const details = await workerService.getWorkerDetails(worker.id);
        setWorkerDetails(details);
      } catch (error) {
        console.error("Error fetching worker details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerDetails();
  }, [worker.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        {" "}
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading worker details...</p>
        </div>
      </div>
    );
  }

  if (!workerDetails) return null;

  const { profile, stats, recent_reviews, work_experience } = workerDetails;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec bannière */}
        <div className="relative">
          <div className="h-40 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition z-10"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-16 left-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Worker"}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-4xl">
                {profile.full_name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
        </div>

        {/* Contenu */}
        <div className="pt-20 px-6 pb-6">
          {/* En-tête avec nom et rating */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.full_name || "Unknown Worker"}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  {renderStars(stats.rating)}
                  <span className="text-sm font-medium text-gray-700 ml-1">
                    {stats.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  {stats.reviews_count}{" "}
                  {stats.reviews_count === 1 ? "review" : "reviews"}
                </span>
                {profile.role && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm text-gray-600 capitalize">
                      {profile.role}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {stats.jobs_completed}
              </div>
              <div className="text-xs text-gray-500">Jobs completed</div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {stats.jobs_completed}
              </div>
              <div className="text-xs text-gray-500">Jobs Done</div>
            </div>
            <div className="text-center">
              <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1 fill-yellow-400" />
              <div className="text-lg font-bold text-gray-900">
                {stats.rating.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
            <div className="text-center">
              <ThumbsUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {stats.response_rate}%
              </div>
              <div className="text-xs text-gray-500">Response Rate</div>
            </div>
            <div className="text-center">
              <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <div className="text-sm font-medium text-gray-900">
                {stats.member_since}
              </div>
              <div className="text-xs text-gray-500">Member Since</div>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="border-t border-gray-100 pt-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {profile.email && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.job_title && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span>{profile.job_title}</span>
                </div>
              )}
              {profile.trade_category && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Award className="w-4 h-4 text-gray-400" />
                  <span>{profile.trade_category}</span>
                </div>
              )}
              {profile.level && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span>{profile.level}</span>
                </div>
              )}
              {profile.hourly_rate && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>${profile.hourly_rate}/hour</span>
                </div>
              )}
            </div>
          </div>

          {/* Compétences */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="border-t border-gray-100 pt-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Expérience professionnelle */}
          {work_experience && work_experience.length > 0 && (
            <div className="border-t border-gray-100 pt-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Work Experience
              </h3>
              <div className="space-y-4">
                {work_experience.map((exp) => (
                  <div key={exp.id} className="flex gap-3">
                    <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {exp.position} at {exp.company_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(exp.start_date).toLocaleDateString("fr-FR", {
                          month: "long",
                          year: "numeric",
                        })}
                        {exp.current
                          ? " - Present"
                          : exp.end_date
                          ? ` - ${new Date(exp.end_date).toLocaleDateString(
                              "fr-FR",
                              { month: "long", year: "numeric" }
                            )}`
                          : ""}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avis récents */}
          {recent_reviews && recent_reviews.length > 0 && (
            <div className="border-t border-gray-100 pt-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Recent Reviews
              </h3>
              <div className="space-y-4">
                {recent_reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {review.reviewer?.full_name || "Anonymous"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {review.review_text}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
