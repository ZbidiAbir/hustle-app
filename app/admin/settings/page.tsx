// app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Settings,
  DollarSign,
  Bell,
  Shield,
  Eye,
  Palette,
  Briefcase,
  MessageSquare,
  CreditCard,
  BarChart3,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  Sun,
  Moon,
  Laptop,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Mail,
  Phone,
  Globe,
  Clock,
  Calendar,
  Users,
  FileText,
  Image,
  Lock,
  Smartphone,
  Zap,
  TrendingUp,
  Award,
  UserCheck,
  UserX,
  MailCheck,
  ShieldCheck,
  Fingerprint,
  Key,
  LockKeyhole,
} from "lucide-react";
import {
  AdminSettings,
  adminSettingsService,
} from "../services/adminSettings.service";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const router = useRouter();

  useEffect(() => {
    checkAdminAndFetchSettings();
  }, []);

  const checkAdminAndFetchSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
      await fetchSettings();
    } catch (error) {
      console.error("Error checking admin:", error);
      router.push("/dashboard");
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminSettingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setSaveStatus("idle");

      const result = await adminSettingsService.updateSettings(settings);

      if (result.success) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setSaveStatus("error");
      setErrorMessage(error.message);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    {
      id: "general",
      title: "General",
      icon: Settings,
      description: "Basic site settings",
    },
    {
      id: "platform",
      title: "Platform",
      icon: DollarSign,
      description: "Fees and withdrawals",
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: Bell,
      description: "Email and push alerts",
    },
    {
      id: "security",
      title: "Security",
      icon: Shield,
      description: "Authentication & protection",
    },
    {
      id: "moderation",
      title: "Moderation",
      icon: Eye,
      description: "Content review settings",
    },
    {
      id: "appearance",
      title: "Appearance",
      icon: Palette,
      description: "Theme and branding",
    },
    {
      id: "jobs",
      title: "Jobs",
      icon: Briefcase,
      description: "Job posting settings",
    },
    {
      id: "messaging",
      title: "Messaging",
      icon: MessageSquare,
      description: "Chat configuration",
    },
    {
      id: "payments",
      title: "Payments",
      icon: CreditCard,
      description: "Payment gateway settings",
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: BarChart3,
      description: "Tracking and metrics",
    },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Name
          </label>
          <input
            type="text"
            value={settings?.siteName || ""}
            onChange={(e) =>
              setSettings({ ...settings!, siteName: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Description
          </label>
          <textarea
            rows={2}
            value={settings?.siteDescription || ""}
            onChange={(e) =>
              setSettings({ ...settings!, siteDescription: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            value={settings?.contactEmail || ""}
            onChange={(e) =>
              setSettings({ ...settings!, contactEmail: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone
          </label>
          <input
            type="tel"
            value={settings?.contactPhone || ""}
            onChange={(e) =>
              setSettings({ ...settings!, contactPhone: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Email
          </label>
          <input
            type="email"
            value={settings?.supportEmail || ""}
            onChange={(e) =>
              setSettings({ ...settings!, supportEmail: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Phone
          </label>
          <input
            type="tel"
            value={settings?.supportPhone || ""}
            onChange={(e) =>
              setSettings({ ...settings!, supportPhone: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderPlatformSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform Fee
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={settings?.platformFee || 0}
              onChange={(e) =>
                setSettings({
                  ...settings!,
                  platformFee: parseFloat(e.target.value),
                })
              }
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
            />
            <select
              value={settings?.platformFeeType || "percentage"}
              onChange={(e) =>
                setSettings({
                  ...settings!,
                  platformFeeType: e.target.value as any,
                })
              }
              className="px-4 py-2 border border-gray-200 rounded-lg"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed ($)</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Fee charged on each completed job
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Withdrawal ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings?.minimumWithdrawal || 0}
            onChange={(e) =>
              setSettings({
                ...settings!,
                minimumWithdrawal: parseFloat(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Withdrawal ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings?.maximumWithdrawal || 0}
            onChange={(e) =>
              setSettings({
                ...settings!,
                maximumWithdrawal: parseFloat(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Withdrawal Days
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <button
                key={day}
                onClick={() => {
                  const newDays = settings?.withdrawalDays?.includes(day)
                    ? settings.withdrawalDays.filter((d) => d !== day)
                    : [...(settings?.withdrawalDays || []), day];
                  setSettings({ ...settings!, withdrawalDays: newDays });
                }}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  settings?.withdrawalDays?.includes(day)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Days when withdrawals are processed
          </p>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-500">
              Send email notifications to users
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings!,
                emailNotifications: !settings?.emailNotifications,
              })
            }
            className={`relative w-12 h-6 rounded-full transition ${
              settings?.emailNotifications ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                settings?.emailNotifications ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">
              Send push notifications to mobile devices
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings!,
                pushNotifications: !settings?.pushNotifications,
              })
            }
            className={`relative w-12 h-6 rounded-full transition ${
              settings?.pushNotifications ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                settings?.pushNotifications ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">SMS Notifications</h3>
            <p className="text-sm text-gray-500">
              Send SMS notifications for critical updates
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings!,
                smsNotifications: !settings?.smsNotifications,
              })
            }
            className={`relative w-12 h-6 rounded-full transition ${
              settings?.smsNotifications ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                settings?.smsNotifications ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Admin Email Alerts</h3>
            <p className="text-sm text-gray-500">
              Receive email alerts for important admin events
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings!,
                adminEmailAlerts: !settings?.adminEmailAlerts,
              })
            }
            className={`relative w-12 h-6 rounded-full transition ${
              settings?.adminEmailAlerts ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                settings?.adminEmailAlerts ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-900">
            Two-Factor Authentication (2FA)
          </h3>
          <p className="text-sm text-gray-500">
            Require 2FA for admin accounts
          </p>
        </div>
        <button
          onClick={() =>
            setSettings({
              ...settings!,
              twoFactorAuth: !settings?.twoFactorAuth,
            })
          }
          className={`relative w-12 h-6 rounded-full transition ${
            settings?.twoFactorAuth ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
              settings?.twoFactorAuth ? "right-1" : "left-1"
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            value={settings?.sessionTimeout || 30}
            onChange={(e) =>
              setSettings({
                ...settings!,
                sessionTimeout: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Login Attempts
          </label>
          <input
            type="number"
            value={settings?.maxLoginAttempts || 5}
            onChange={(e) =>
              setSettings({
                ...settings!,
                maxLoginAttempts: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password Policy
          </label>
          <select
            value={settings?.passwordPolicy || "strong"}
            onChange={(e) =>
              setSettings({
                ...settings!,
                passwordPolicy: e.target.value as any,
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="standard">Standard (8+ characters)</option>
            <option value="strong">Strong (8+ chars, number, uppercase)</option>
            <option value="very_strong">
              Very Strong (12+ chars, number, uppercase, symbol)
            </option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderModerationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Auto Moderate Jobs</h3>
            <p className="text-sm text-gray-500">
              Automatically review and approve new jobs
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings!,
                autoModerateJobs: !settings?.autoModerateJobs,
              })
            }
            className={`relative w-12 h-6 rounded-full transition ${
              settings?.autoModerateJobs ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                settings?.autoModerateJobs ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Auto Moderate Reviews</h3>
            <p className="text-sm text-gray-500">
              Automatically review and approve reviews
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings!,
                autoModerateReviews: !settings?.autoModerateReviews,
              })
            }
            className={`relative w-12 h-6 rounded-full transition ${
              settings?.autoModerateReviews ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                settings?.autoModerateReviews ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dispute Review Time (hours)
            </label>
            <input
              type="number"
              value={settings?.disputeReviewTime || 48}
              onChange={(e) =>
                setSettings({
                  ...settings!,
                  disputeReviewTime: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Dispute Evidence Files
            </label>
            <input
              type="number"
              value={settings?.maxDisputeEvidenceFiles || 10}
              onChange={(e) =>
                setSettings({
                  ...settings!,
                  maxDisputeEvidenceFiles: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Dispute File Size (MB)
            </label>
            <input
              type="number"
              value={settings?.maxDisputeFileSize || 10}
              onChange={(e) =>
                setSettings({
                  ...settings!,
                  maxDisputeFileSize: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Theme
        </label>
        <div className="flex gap-4">
          {[
            { value: "light", icon: Sun, label: "Light" },
            { value: "dark", icon: Moon, label: "Dark" },
            { value: "system", icon: Laptop, label: "System" },
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() =>
                setSettings({ ...settings!, theme: theme.value as any })
              }
              className={`flex-1 p-4 border-2 rounded-xl text-center transition ${
                settings?.theme === theme.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <theme.icon
                className={`w-6 h-6 mx-auto mb-2 ${
                  settings?.theme === theme.value
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  settings?.theme === theme.value
                    ? "text-blue-600"
                    : "text-gray-700"
                }`}
              >
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings?.primaryColor || "#3b82f6"}
              onChange={(e) =>
                setSettings({ ...settings!, primaryColor: e.target.value })
              }
              className="w-12 h-10 rounded border border-gray-200"
            />
            <input
              type="text"
              value={settings?.primaryColor || ""}
              onChange={(e) =>
                setSettings({ ...settings!, primaryColor: e.target.value })
              }
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accent Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings?.accentColor || "#8b5cf6"}
              onChange={(e) =>
                setSettings({ ...settings!, accentColor: e.target.value })
              }
              className="w-12 h-10 rounded border border-gray-200"
            />
            <input
              type="text"
              value={settings?.accentColor || ""}
              onChange={(e) =>
                setSettings({ ...settings!, accentColor: e.target.value })
              }
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo Position
        </label>
        <div className="flex gap-4">
          {[
            { value: "left", icon: AlignLeft, label: "Left" },
            { value: "center", icon: AlignCenter, label: "Center" },
            { value: "right", icon: AlignRight, label: "Right" },
          ].map((position) => (
            <button
              key={position.value}
              onClick={() =>
                setSettings({
                  ...settings!,
                  logoPosition: position.value as any,
                })
              }
              className={`flex-1 p-4 border-2 rounded-xl text-center transition ${
                settings?.logoPosition === position.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <position.icon
                className={`w-6 h-6 mx-auto mb-2 ${
                  settings?.logoPosition === position.value
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  settings?.logoPosition === position.value
                    ? "text-blue-600"
                    : "text-gray-700"
                }`}
              >
                {position.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderJobsSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Job Expiration (days)
          </label>
          <input
            type="number"
            value={settings?.defaultJobExpiration || 30}
            onChange={(e) =>
              setSettings({
                ...settings!,
                defaultJobExpiration: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Job Images
          </label>
          <input
            type="number"
            value={settings?.maxJobImages || 10}
            onChange={(e) =>
              setSettings({
                ...settings!,
                maxJobImages: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Job Price ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings?.minJobPrice || 50}
            onChange={(e) =>
              setSettings({
                ...settings!,
                minJobPrice: parseFloat(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Job Price ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings?.maxJobPrice || 10000}
            onChange={(e) =>
              setSettings({
                ...settings!,
                maxJobPrice: parseFloat(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allowed Job Categories
          </label>
          <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
            {settings?.allowedJobCategories?.map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm"
              >
                {category}
                <button
                  onClick={() => {
                    const newCategories = settings.allowedJobCategories.filter(
                      (_, i) => i !== index
                    );
                    setSettings({
                      ...settings!,
                      allowedJobCategories: newCategories,
                    });
                  }}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                const newCategory = prompt("Enter new category name:");
                if (
                  newCategory &&
                  !settings?.allowedJobCategories.includes(newCategory)
                ) {
                  setSettings({
                    ...settings!,
                    allowedJobCategories: [
                      //@ts-ignore
                      ...settings.allowedJobCategories,
                      newCategory,
                    ],
                  });
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1 border border-dashed border-gray-300 rounded-full text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
            >
              <Plus className="w-3 h-3" />
              Add Category
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessagingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Message Length (characters)
          </label>
          <input
            type="number"
            value={settings?.maxMessageLength || 5000}
            onChange={(e) =>
              setSettings({
                ...settings!,
                maxMessageLength: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Retention (days)
          </label>
          <input
            type="number"
            value={settings?.messageRetentionDays || 365}
            onChange={(e) =>
              setSettings({
                ...settings!,
                messageRetentionDays: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Attachment Size (MB)
          </label>
          <input
            type="number"
            value={settings?.maxAttachmentSize || 10}
            onChange={(e) =>
              setSettings({
                ...settings!,
                maxAttachmentSize: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-900">
            Allow Message Attachments
          </h3>
          <p className="text-sm text-gray-500">
            Allow users to send files in messages
          </p>
        </div>
        <button
          onClick={() =>
            setSettings({
              ...settings!,
              allowMessageAttachments: !settings?.allowMessageAttachments,
            })
          }
          className={`relative w-12 h-6 rounded-full transition ${
            settings?.allowMessageAttachments ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
              settings?.allowMessageAttachments ? "right-1" : "left-1"
            }`}
          />
        </button>
      </div>
    </div>
  );

  const renderPaymentsSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Gateway
        </label>
        <select
          value={settings?.paymentGateway || "stripe"}
          onChange={(e) =>
            setSettings({ ...settings!, paymentGateway: e.target.value as any })
          }
          className="w-full px-4 py-2 border border-gray-200 rounded-lg"
        >
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
          <option value="both">Both (Stripe & PayPal)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <input
            type="text"
            value={settings?.currency || "USD"}
            onChange={(e) =>
              setSettings({ ...settings!, currency: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency Symbol
          </label>
          <input
            type="text"
            value={settings?.currencySymbol || "$"}
            onChange={(e) =>
              setSettings({ ...settings!, currencySymbol: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stripe Public Key
          </label>
          <input
            type="text"
            value={settings?.stripePublicKey || ""}
            onChange={(e) =>
              setSettings({ ...settings!, stripePublicKey: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            placeholder="pk_test_..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stripe Secret Key
          </label>
          <input
            type="password"
            value={settings?.stripeSecretKey || ""}
            onChange={(e) =>
              setSettings({ ...settings!, stripeSecretKey: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            placeholder="sk_test_..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PayPal Client ID
          </label>
          <input
            type="text"
            value={settings?.paypalClientId || ""}
            onChange={(e) =>
              setSettings({ ...settings!, paypalClientId: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PayPal Secret
          </label>
          <input
            type="password"
            value={settings?.paypalSecret || ""}
            onChange={(e) =>
              setSettings({ ...settings!, paypalSecret: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>
      </div>
    </div>
  );

  const renderAnalyticsSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-900">Enable Analytics</h3>
          <p className="text-sm text-gray-500">
            Enable Google Analytics and Facebook Pixel tracking
          </p>
        </div>
        <button
          onClick={() =>
            setSettings({
              ...settings!,
              enableAnalytics: !settings?.enableAnalytics,
            })
          }
          className={`relative w-12 h-6 rounded-full transition ${
            settings?.enableAnalytics ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
              settings?.enableAnalytics ? "right-1" : "left-1"
            }`}
          />
        </button>
      </div>

      {settings?.enableAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Analytics ID
            </label>
            <input
              type="text"
              value={settings?.googleAnalyticsId || ""}
              onChange={(e) =>
                setSettings({ ...settings!, googleAnalyticsId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="G-XXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook Pixel ID
            </label>
            <input
              type="text"
              value={settings?.facebookPixelId || ""}
              onChange={(e) =>
                setSettings({ ...settings!, facebookPixelId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="123456789"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return renderGeneralSettings();
      case "platform":
        return renderPlatformSettings();
      case "notifications":
        return renderNotificationsSettings();
      case "security":
        return renderSecuritySettings();
      case "moderation":
        return renderModerationSettings();
      case "appearance":
        return renderAppearanceSettings();
      case "jobs":
        return renderJobsSettings();
      case "messaging":
        return renderMessagingSettings();
      case "payments":
        return renderPaymentsSettings();
      case "analytics":
        return renderAnalyticsSettings();
      default:
        return null;
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-500 mt-1">
            Configure your platform settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-8">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{section.title}</div>
                      <div className="text-xs text-gray-500">
                        {section.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {sections.find((s) => s.id === activeSection)?.title}
                </h2>
              </div>

              <div className="p-6">{renderSection()}</div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <div>
                    {saveStatus === "success" && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">
                          Settings saved successfully!
                        </span>
                      </div>
                    )}
                    {saveStatus === "error" && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">Error: {errorMessage}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
