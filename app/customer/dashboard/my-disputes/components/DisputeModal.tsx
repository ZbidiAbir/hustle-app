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
  Gavel,
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
  publicUrl?: string;
}

export function DisputeModal({
  dispute,
  onClose,
  onRefresh,
}: DisputeModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);

  useEffect(() => {
    // Traiter les preuves au chargement du modal
    if (dispute.evidence && dispute.evidence.length > 0) {
      const items = dispute.evidence.map((url, index) => {
        const fileName = getFileNameFromUrl(url);
        const fileType = getFileType(url);
        const publicUrl = getPublicUrlFromStorage(url);

        return {
          url,
          publicUrl,
          type: fileType,
          name: fileName || `Evidence ${index + 1}`,
          loading: true,
          error: false,
        };
      });
      setEvidenceItems(items);

      // Vérifier chaque fichier
      items.forEach((item, index) => {
        checkFileAccess(item, index);
      });
    }
  }, [dispute.evidence]);

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

  const getPublicUrlFromStorage = (url: string): string => {
    try {
      // Si c'est déjà une URL publique de Supabase
      if (url.includes("supabase.co/storage/v1/object/public")) {
        return url;
      }

      // Extraire le chemin du fichier depuis l'URL
      let filePath = "";

      // Format: /storage/v1/object/authenticated/dispute-evidence/filename.jpg
      if (url.includes("/object/authenticated/")) {
        const match = url.match(/\/object\/authenticated\/([^?]+)/);
        if (match) {
          filePath = match[1];
        }
      }
      // Format: /storage/v1/object/dispute-evidence/filename.jpg
      else if (url.includes("/object/")) {
        const match = url.match(/\/object\/([^?]+)/);
        if (match) {
          filePath = match[1];
        }
      }
      // Si l'URL contient directement le bucket
      else if (url.includes("dispute-evidence")) {
        const match = url.match(/dispute-evidence\/(.+)/);
        if (match) {
          filePath = match[1];
        }
      }

      if (filePath) {
        // Générer l'URL publique depuis le bucket dispute-evidence
        const { data } = supabase.storage
          .from("dispute-evidence")
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          console.log("Generated public URL:", data.publicUrl);
          return data.publicUrl;
        }
      }
    } catch (error) {
      console.error("Error generating public URL:", error);
    }

    return url;
  };

  const getFileType = (url: string): string => {
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

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="w-8 h-8 text-blue-500" />;
      case "video":
        return <FileVideo className="w-8 h-8 text-purple-500" />;
      case "pdf":
        return <FilePdf className="w-8 h-8 text-red-500" />;
      case "archive":
        return <FileArchive className="w-8 h-8 text-amber-500" />;
      case "json":
        return <FileJson className="w-8 h-8 text-green-500" />;
      case "code":
        return <FileCode className="w-8 h-8 text-indigo-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const checkFileAccess = async (item: EvidenceItem, index: number) => {
    try {
      const urlToCheck = item.publicUrl || item.url;

      if (item.type === "image") {
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
          // Essayer avec un token d'authentification
          await tryAuthenticatedUrl(item, index);
        };
        img.src = urlToCheck;
      } else {
        // Pour les autres fichiers, vérifier avec fetch
        try {
          const response = await fetch(urlToCheck, { method: "HEAD" });
          if (response.ok) {
            setEvidenceItems((prev) => {
              const newItems = [...prev];
              newItems[index].loading = false;
              newItems[index].error = false;
              return newItems;
            });
          } else {
            await tryAuthenticatedUrl(item, index);
          }
        } catch (error) {
          await tryAuthenticatedUrl(item, index);
        }
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

  const tryAuthenticatedUrl = async (item: EvidenceItem, index: number) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Construire l'URL authentifiée
      let authenticatedUrl = item.url;
      if (!authenticatedUrl.includes("access_token")) {
        authenticatedUrl = `${authenticatedUrl}${
          authenticatedUrl.includes("?") ? "&" : "?"
        }access_token=${session?.access_token}`;
      }

      const response = await fetch(authenticatedUrl, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        setEvidenceItems((prev) => {
          const newItems = [...prev];
          newItems[index].url = authenticatedUrl;
          newItems[index].loading = false;
          newItems[index].error = false;
          return newItems;
        });
      } else {
        setEvidenceItems((prev) => {
          const newItems = [...prev];
          newItems[index].loading = false;
          newItems[index].error = true;
          return newItems;
        });
      }
    } catch (error) {
      console.error("Error with authenticated URL:", error);
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const urlToDownload = item.url;

      const response = await fetch(urlToDownload, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

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
        // Fallback: ouvrir dans un nouvel onglet
        window.open(item.publicUrl || item.url, "_blank");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      window.open(item.publicUrl || item.url, "_blank");
    }
  };

  const getDisplayUrl = (item: EvidenceItem): string => {
    return item.publicUrl || item.url;
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

  const formatDate = (dateString?: string) => {
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

  const formatCurrency = (amount?: number) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleResolveDispute = async (resolution: "resolved" | "dismissed") => {
    if (!resolutionNotes.trim()) {
      alert("Please provide resolution notes");
      return;
    }

    try {
      setResolving(true);

      const { data: userData } = await supabase.auth.getUser();
      const resolvedById = userData.user?.id;

      const { error } = await supabase
        .from("disputes")
        .update({
          status: resolution,
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedById,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dispute.id);

      if (error) throw error;

      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error resolving dispute:", error);
      alert("Error resolving dispute. Please try again.");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 flex-wrap">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Dispute Details</h2>
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
                  {/* <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Budget
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatCurrency(dispute.job.budget)}
                      <span className="text-sm text-gray-500 ml-1">
                        ({dispute.job.budget_type})
                      </span>
                    </p>
                  </div> */}

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
                  {dispute.created_by_user?.full_name || "N/A"}(
                  {dispute.created_by_user?.role})
                </p>
                <p className="text-sm flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span className="font-medium">Email:</span>{" "}
                  {dispute.created_by_user?.email || "N/A"} ({" "}
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

          {/* Evidence */}
          {evidenceItems.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Evidence ({evidenceItems.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {evidenceItems.map((item, index) => (
                  <div
                    key={index}
                    className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition"
                  >
                    {item.loading ? (
                      <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                      </div>
                    ) : item.error ? (
                      <div className="w-full h-32 flex flex-col items-center justify-center bg-red-50">
                        <AlertTriangle className="w-8 h-8 text-red-400 mb-1" />
                        <p className="text-xs text-red-500 text-center px-2">
                          Cannot load file
                        </p>
                      </div>
                    ) : item.type === "image" ? (
                      <img
                        src={getDisplayUrl(item)}
                        alt={item.name}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          console.error("Image failed to load:", item.url);
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = document.createElement("div");
                            fallback.className =
                              "w-full h-32 flex flex-col items-center justify-center bg-gray-100";
                            fallback.innerHTML = `
                              <svg class="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <p class="text-xs text-gray-500 text-center px-2">Preview not available</p>
                            `;
                            parent.appendChild(fallback);
                            e.currentTarget.remove();
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-100">
                        {getFileIcon(item.type)}
                        <p className="text-xs text-gray-600 mt-2 text-center px-2 truncate w-full">
                          {item.name}
                        </p>
                      </div>
                    )}

                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-1.5 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-700" />
                      </button>
                      <a
                        href={getDisplayUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-700" />
                      </a>
                    </div>

                    {/* File name tooltip */}
                    {item.name && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-all duration-200">
                        {item.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Information */}
          {dispute.status === "resolved" && dispute.resolution_notes && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Resolution Details
              </h3>
              <p className="text-sm text-green-800 mb-2 whitespace-pre-wrap">
                {dispute.resolution_notes}
              </p>
              <p className="text-xs text-green-600">
                Resolved by {dispute.resolved_by_user?.full_name || "Admin"} on{" "}
                {formatDate(
                  //@ts-ignore
                  dispute.resolved_at
                )}
              </p>
            </div>
          )}

          {/* Resolution Form */}
          {/* {(dispute.status === "pending" ||
            dispute.status === "under_review") && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Gavel className="w-4 h-4" />
                Resolve Dispute
              </h3>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter resolution notes explaining your decision..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleResolveDispute("resolved")}
                  disabled={resolving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resolving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Resolve in Favor of Customer
                </button>
                <button
                  onClick={() => handleResolveDispute("dismissed")}
                  disabled={resolving}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resolving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Dismiss Dispute
                </button>
              </div>
            </div>
          )} */}
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
