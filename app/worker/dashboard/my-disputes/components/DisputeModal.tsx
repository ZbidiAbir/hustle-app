"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  DollarSign,
  Calendar,
  User,
  FileText,
  Image,
  Download,
  Shield,
  Scale,
  Briefcase,
  Star,
  Loader2,
  MapPin,
  Mail,
  ExternalLink,
  File,
  FileImage,
  FileVideo,
  FileArchive,
  FileCode,
  FileJson,
  ZoomIn,
  Check,
  UserCheck,
  Award,
} from "lucide-react";
import { DisputeWithDetails } from "../page";

interface DisputeModalProps {
  dispute: DisputeWithDetails;
  onClose: () => void;
  onRefresh: () => void;
}

interface EvidenceItem {
  url: string;
  type: string;
  name: string;
  loading: boolean;
  error: boolean;
  isSecureImage: boolean;
}

interface ResolutionDetails {
  resolved_by_user?: {
    full_name: string;
    role: string;
    email: string;
  } | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  status_history?: Array<{
    status: string;
    changed_at: string;
    changed_by: string;
    notes?: string;
  }> | null;
  approved_by_user?: {
    full_name: string;
    role: string;
  } | null;
  reviewed_by_user?: {
    full_name: string;
    role: string;
  } | null;
}

export function DisputeModal({
  dispute,
  onClose,
  onRefresh,
}: DisputeModalProps) {
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );
  const [resolutionDetails, setResolutionDetails] =
    useState<ResolutionDetails | null>(null);
  const [loadingResolution, setLoadingResolution] = useState(false);

  useEffect(() => {
    // Traiter les preuves au chargement du modal
    if (dispute.evidence && dispute.evidence.length > 0) {
      const items = dispute.evidence.map((url, index) => {
        const fileName = getFileNameFromUrl(url);
        const fileType = getFileType(url);

        return {
          url,
          type: fileType,
          name: fileName || `Evidence ${index + 1}`,
          loading: true,
          error: false,
          isSecureImage:
            url.includes("sdimage") || url.includes("secure-download"),
        };
      });
      setEvidenceItems(items);

      // Vérifier chaque fichier
      items.forEach((item, index) => {
        checkFileAccess(item, index);
      });
    }

    // Charger les détails de résolution si le statut est resolved
    if (dispute.status === "resolved" || dispute.status === "review_approved") {
      fetchResolutionDetails();
    }
  }, [dispute.evidence, dispute.status, dispute.id]);

  const fetchResolutionDetails = async () => {
    setLoadingResolution(true);
    try {
      // Récupérer les informations du résolveur
      let resolvedByUser = null;
      if (dispute.resolved_by) {
        const { data: userData, error } = await supabase
          .from("profiles")
          .select("id, full_name, role, email")
          .eq("id", dispute.resolved_by)
          .single();

        if (!error && userData) {
          resolvedByUser = {
            full_name: userData.full_name || "Unknown",
            role: userData.role || "Admin",
            email: userData.email || "",
          };
        }
      }

      // Récupérer les informations de l'approbateur si review_approved
      // Note: Utiliser resolved_by comme approbateur si approved_by n'existe pas
      let approvedByUser = null;
      if (dispute.status === "review_approved" && dispute.resolved_by) {
        const { data: userData, error } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("id", dispute.resolved_by)
          .single();

        if (!error && userData) {
          approvedByUser = {
            full_name: userData.full_name || "Unknown",
            role: userData.role || "Admin",
          };
        }
      }

      // Récupérer les informations du reviewer
      // Note: Utiliser created_by comme reviewer si reviewed_by n'existe pas
      let reviewedByUser = null;
      if (dispute.status === "under_review" && dispute.created_by) {
        const { data: userData, error } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("id", dispute.created_by)
          .single();

        if (!error && userData) {
          reviewedByUser = {
            full_name: userData.full_name || "Unknown",
            role: userData.role || "User",
          };
        }
      }

      setResolutionDetails({
        resolved_by_user: resolvedByUser,
        resolution_notes: dispute.resolution_notes,
        resolved_at: dispute.resolved_at,
        status_history:
          //@ts-ignore
          dispute?.status_history,
        approved_by_user: approvedByUser,
        reviewed_by_user: reviewedByUser,
      });
    } catch (error) {
      console.error("Error fetching resolution details:", error);
    } finally {
      setLoadingResolution(false);
    }
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      // Extraire le nom du fichier de l'URL
      if (url.includes("/object/")) {
        const match = url.match(/\/object\/[^/]+\/(.+)/);
        if (match) {
          return decodeURIComponent(match[1].split("?")[0]);
        }
      }

      // Essayer de prendre le dernier segment de l'URL
      const segments = url.split("/");
      const lastSegment = segments[segments.length - 1];
      if (lastSegment) {
        return decodeURIComponent(lastSegment.split("?")[0]);
      }
    } catch (e) {
      console.error("Error extracting filename:", e);
    }
    return "";
  };

  const getFileType = (url: string): string => {
    // Vérifier si c'est une URL sdimage
    if (url.includes("sdimage") || url.includes("secure-download")) {
      return "secure_image";
    }

    const extension = url.split(".").pop()?.toLowerCase().split("?")[0];

    if (
      url.includes("data:image") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(
        extension || ""
      )
    ) {
      return "image";
    }
    if (["mp4", "webm", "mov", "avi"].includes(extension || "")) {
      return "video";
    }
    if (["pdf"].includes(extension || "")) {
      return "pdf";
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(extension || "")) {
      return "archive";
    }
    if (["json"].includes(extension || "")) {
      return "json";
    }
    if (
      [
        "js",
        "ts",
        "jsx",
        "tsx",
        "py",
        "java",
        "c",
        "cpp",
        "html",
        "css",
      ].includes(extension || "")
    ) {
      return "code";
    }
    return "file";
  };

  const getFileIcon = (type: string, size: string = "w-8 h-8") => {
    switch (type) {
      case "image":
        return <FileImage className={`${size} text-blue-500`} />;
      case "secure_image":
        return <Shield className={`${size} text-green-500`} />;
      case "video":
        return <FileVideo className={`${size} text-purple-500`} />;
      case "pdf":
        return <FilePdf className={`${size} text-red-500`} />;
      case "archive":
        return <FileArchive className={`${size} text-amber-500`} />;
      case "json":
        return <FileJson className={`${size} text-green-500`} />;
      case "code":
        return <FileCode className={`${size} text-indigo-500`} />;
      default:
        return <File className={`${size} text-gray-500`} />;
    }
  };

  const checkFileAccess = async (item: EvidenceItem, index: number) => {
    try {
      const isImageType = item.type === "image" || item.type === "secure_image";

      if (isImageType) {
        // Pour les images, on peut utiliser un objet Image
        const img =
          //@ts-ignore
          new Image();

        img.onload = () => {
          setEvidenceItems((prev) => {
            const newItems = [...prev];
            newItems[index].loading = false;
            newItems[index].error = false;
            return newItems;
          });
        };

        img.onerror = async () => {
          // Si l'image ne charge pas, marquer comme erreur
          setEvidenceItems((prev) => {
            const newItems = [...prev];
            newItems[index].loading = false;
            newItems[index].error = true;
            return newItems;
          });
        };

        img.src = item.url;
      } else {
        // Pour les autres fichiers, considérer comme valide sans vérification
        setTimeout(() => {
          setEvidenceItems((prev) => {
            const newItems = [...prev];
            newItems[index].loading = false;
            newItems[index].error = false;
            return newItems;
          });
        }, 500);
      }
    } catch (error) {
      console.error("Error checking file access:", error);
      setEvidenceItems((prev) => {
        const newItems = [...prev];
        newItems[index].loading = false;
        newItems[index].error = true;
        return newItems;
      });
    }
  };

  const handleDownload = async (item: EvidenceItem) => {
    try {
      const response = await fetch(item.url);
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        window.open(item.url, "_blank");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      window.open(item.url, "_blank");
    }
  };

  const handleImageError = (url: string) => {
    setImageLoadErrors((prev) => new Set(prev).add(url));
  };

  const isImage = (type: string) => {
    return type === "image" || type === "secure_image";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Under Review
          </span>
        );
      case "review_approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Review Approved
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { icon: any; color: string; label: string }> =
      {
        payment: {
          icon: DollarSign,
          color: "bg-green-100 text-green-800",
          label: "Payment",
        },
        quality: {
          icon: Star,
          color: "bg-purple-100 text-purple-800",
          label: "Quality",
        },
        timeline: {
          icon: Calendar,
          color: "bg-orange-100 text-orange-800",
          label: "Timeline",
        },
        communication: {
          icon: MessageSquare,
          color: "bg-blue-100 text-blue-800",
          label: "Communication",
        },
        safety: {
          icon: Shield,
          color: "bg-red-100 text-red-800",
          label: "Safety",
        },
        other: {
          icon: AlertTriangle,
          color: "bg-gray-100 text-gray-800",
          label: "Other",
        },
      };

    const badge = badges[type] || badges.other;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const images = evidenceItems.filter((item) => isImage(item.type));
  const documents = evidenceItems.filter((item) => !isImage(item.type));
  const displayImages = expandedEvidence ? images : images.slice(0, 4);

  // Vérifier si le litige est résolu ou approuvé
  const isResolved =
    dispute.status === "resolved" || dispute.status === "review_approved";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3 flex-wrap">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Dispute Details
              </h2>
              {getTypeBadge(dispute.type)}
              {getStatusBadge(dispute.status)}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Job Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Job Information
              </h3>

              {dispute.job ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Job Title</p>
                    <p className="text-lg font-bold text-gray-900">
                      {dispute.job.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Job Status</p>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          dispute.job.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : dispute.job.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : dispute.job.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {dispute.job.status || "Unknown"}
                      </span>
                    </div>

                    {(dispute.job.location || dispute.job.address) && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Location
                        </p>
                        <p className="text-sm text-gray-900">
                          {dispute.job.location || dispute.job.address || "N/A"}
                        </p>
                      </div>
                    )}
                  </div>

                  {dispute.job.description && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-2">
                        Job Description
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {dispute.job.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Job information not found. Job ID: {dispute.job_id}
                  </p>
                </div>
              )}
            </div>

            {/* Disputants Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Created By
                </h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span>{" "}
                    {dispute.created_by_user?.full_name || "N/A"} (
                    {dispute.created_by_user?.role})
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span className="font-medium">Email:</span>{" "}
                    {dispute.created_by_user?.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Against (Professional)
                </h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span>{" "}
                    {dispute.against_user_details?.full_name || "N/A"} (
                    {dispute.against_user_details?.role})
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span className="font-medium">Email:</span>{" "}
                    {dispute.against_user_details?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Dispute Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Dispute Description
              </h3>
              <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap bg-white p-3 rounded-lg">
                {dispute.description}
              </p>

              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Preferred Resolution
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg">
                {dispute.preferred_resolution}
              </p>
            </div>

            {/* RESOLUTION SECTION - Afficher uniquement si le litige est résolu */}
            {isResolved && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Resolution Details
                </h3>

                {loadingResolution ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Resolution Notes */}
                    {resolutionDetails?.resolution_notes && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Resolution Notes
                        </p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {resolutionDetails.resolution_notes}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Resolved By */}
                      {resolutionDetails?.resolved_by_user && (
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-green-600" />
                            Resolved By
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {resolutionDetails.resolved_by_user.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {resolutionDetails.resolved_by_user.role}
                          </p>
                          {resolutionDetails.resolved_by_user.email && (
                            <p className="text-xs text-gray-400 mt-1">
                              {resolutionDetails.resolved_by_user.email}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Resolved At */}
                      {resolutionDetails?.resolved_at && (
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-green-600" />
                            Resolved On
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(resolutionDetails.resolved_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Review and Approval Info */}
                    {(resolutionDetails?.reviewed_by_user ||
                      resolutionDetails?.approved_by_user) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resolutionDetails?.reviewed_by_user && (
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                              <Award className="w-3 h-3 text-purple-600" />
                              Reviewed By
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {resolutionDetails.reviewed_by_user.full_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {resolutionDetails.reviewed_by_user.role}
                            </p>
                          </div>
                        )}

                        {resolutionDetails?.approved_by_user && (
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                              Approved By
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {resolutionDetails.approved_by_user.full_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {resolutionDetails.approved_by_user.role}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Evidence Section */}
            {evidenceItems.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Evidence ({evidenceItems.length})
                </h3>

                {/* Images Gallery */}
                {images.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        Images ({images.length})
                      </p>
                      {images.length > 4 && (
                        <button
                          onClick={() => setExpandedEvidence(!expandedEvidence)}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {expandedEvidence
                            ? "Show less"
                            : `Show all (${images.length})`}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {displayImages.map((item, index) => {
                        const hasError = imageLoadErrors.has(item.url);

                        return (
                          <div
                            key={index}
                            className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer"
                            onClick={() => {
                              if (!hasError && !item.loading) {
                                setSelectedImage(item.url);
                              }
                            }}
                          >
                            {item.loading ? (
                              <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                              </div>
                            ) : hasError ? (
                              <div className="w-full h-32 flex flex-col items-center justify-center bg-red-50 p-2">
                                <AlertTriangle className="w-8 h-8 text-red-400 mb-1" />
                                <p className="text-xs text-red-500 text-center px-2">
                                  Unable to load image
                                </p>
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 mt-1 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View directly
                                </a>
                              </div>
                            ) : (
                              <>
                                <img
                                  src={item.url}
                                  alt={item.name}
                                  className="w-full h-32 object-cover group-hover:opacity-75 transition"
                                  onError={() => handleImageError(item.url)}
                                />
                                {item.isSecureImage && (
                                  <div className="absolute top-2 right-2 bg-green-500/80 text-white rounded-full p-1">
                                    <Shield className="w-3 h-3" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <ZoomIn className="w-6 h-6 text-white" />
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Documents List */}
                {documents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Documents ({documents.length})
                    </p>
                    <div className="space-y-2">
                      {documents.map((item, index) => (
                        <a
                          key={index}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-100 transition group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(item.type, "w-5 h-5")}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.name}
                                </p>
                                {item.isSecureImage && (
                                  <Shield className="w-3 h-3 text-green-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 capitalize">
                                {item.type === "secure_image"
                                  ? "Secure Image"
                                  : item.type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Download
                              className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDownload(item);
                              }}
                            />
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal for fullscreen view */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size evidence"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onError={() => {
                setImageLoadErrors((prev) => new Set(prev).add(selectedImage));
              }}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <a
              href={selectedImage}
              download
              className="absolute bottom-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}

// Ajouter le composant FilePdf manquant
const FilePdf = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);
