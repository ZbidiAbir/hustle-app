"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Briefcase,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Loader2,
  Phone,
  MapPin,
  Building2,
  Home,
  Globe,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Award,
  Wrench,
  AlertCircle,
} from "lucide-react";

type AccountType = "homeowner" | "smallbusiness";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [role, setRole] = useState<"customer" | "worker">("customer");
  const [accountType, setAccountType] = useState<AccountType>("homeowner");

  // Worker specific fields
  const [jobTitle, setJobTitle] = useState("");
  const [tradeCategory, setTradeCategory] = useState("");
  const [level, setLevel] = useState("beginner");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [rateType, setRateType] = useState<"hourly" | "fixed" | "project">(
    "hourly"
  );

  // Business specific fields
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessCountry, setBusinessCountry] = useState("");
  const [businessZipCode, setBusinessZipCode] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] =
    useState("");
  const [businessYearFounded, setBusinessYearFounded] = useState("");
  const [businessEmployeesCount, setBusinessEmployeesCount] = useState("1-10");
  const [businessDescription, setBusinessDescription] = useState("");
  const [taxId, setTaxId] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const router = useRouter();

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword || !fullName || !phone) {
      setMessage({
        text: "❌ Please fill in all required fields",
        type: "error",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({
        text: "❌ Please enter a valid email address",
        type: "error",
      });
      return false;
    }

    if (password !== confirmPassword) {
      setMessage({
        text: "❌ Passwords do not match",
        type: "error",
      });
      return false;
    }

    if (password.length < 6) {
      setMessage({
        text: "❌ Password must be at least 6 characters",
        type: "error",
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (role === "customer") {
      if (!accountType) {
        setMessage({
          text: "❌ Please select account type",
          type: "error",
        });
        return false;
      }

      if (accountType === "smallbusiness") {
        if (!companyName || !businessAddress || !businessCity) {
          setMessage({
            text: "❌ Please fill in all business information",
            type: "error",
          });
          return false;
        }
      }
    } else {
      if (!jobTitle || !tradeCategory || skills.length === 0) {
        setMessage({
          text: "❌ Please fill in your professional information",
          type: "error",
        });
        return false;
      }
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateStep1()) return;
    if (!validateStep2()) return;
    if (!acceptedTerms) {
      setMessage({
        text: "❌ You must accept the terms and conditions",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setMessage({ text: "Creating your account...", type: "info" });

    try {
      // 1. Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setMessage({
            text: "❌ This email is already registered. Please use a different email or try logging in.",
            type: "error",
          });
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        // 2. Prepare profile data based on role
        const profileData: any = {
          id: data.user.id,
          email,
          full_name: fullName,
          role,
          phone: phone || null,
          address: address || null,
          city: city || null,
          country: country || null,
          zip_code: zipCode || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          loyalty_points: 0,
          metadata: {},
        };

        // Add customer specific data
        if (role === "customer") {
          profileData.account_type = accountType;

          if (accountType === "smallbusiness") {
            profileData.company_name = companyName || null;
            profileData.company_phone = companyPhone || null;
            profileData.company_email = companyEmail || email;
            profileData.business_address = businessAddress || null;
            profileData.business_city = businessCity || null;
            profileData.business_country = businessCountry || null;
            profileData.business_zip_code = businessZipCode || null;
            profileData.business_website = businessWebsite || null;
            profileData.business_registration_number =
              businessRegistrationNumber || null;
            profileData.business_year_founded = businessYearFounded
              ? parseInt(businessYearFounded)
              : null;
            profileData.business_employees_count =
              businessEmployeesCount || null;
            profileData.business_description = businessDescription || null;
            profileData.tax_id = taxId || null;
            profileData.business_verified = false;
          }
        }
        // Add worker specific data
        else {
          profileData.job_title = jobTitle || null;
          profileData.trade_category = tradeCategory || null;
          profileData.level = level || null;
          profileData.skills = skills || [];
          profileData.hourly_rate = hourlyRate ? parseFloat(hourlyRate) : null;
          profileData.rate_type = rateType || null;
          profileData.business_verified = false;
          profileData.insurance_verified = false;
        }

        console.log("Attempting to create profile with data:", profileData);

        // 3. Create profile in profiles table
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([profileData]);

        if (profileError) {
          console.error("Profile creation error details:", profileError);

          // If profile creation fails, try to delete the auth user to clean up
          // Note: This requires admin privileges, so we'll just show a detailed error
          setMessage({
            text: `❌ Account created but profile setup failed: ${profileError.message}. Please contact support with this error.`,
            type: "error",
          });

          // Log the full error for debugging
          console.error(
            "Full profile error:",
            JSON.stringify(profileError, null, 2)
          );
          return;
        }

        setMessage({
          text: "✅ Account created! Please check your email to confirm your registration.",
          type: "success",
        });

        // Clear form
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 3000);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setMessage({
        text: `❌ Error: ${
          error.message || "Something went wrong. Please try again."
        }`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      if (currentStep === 1) {
        if (validateStep1()) {
          setCurrentStep(2);
        }
      } else {
        handleSignup();
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            HUSTLE
          </h1>
          <p className="text-gray-600 mt-2">
            Create your account and start your journey
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center w-full max-w-md">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                currentStep >= 1
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-1 mx-2 transition-colors ${
                currentStep >= 2 ? "bg-indigo-600" : "bg-gray-200"
              }`}
            />
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                currentStep >= 2
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === 1) {
                if (validateStep1()) {
                  setCurrentStep(2);
                }
              } else {
                handleSignup();
              }
            }}
            className="space-y-5"
          >
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Basic Information
                </h2>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                      placeholder="John Doe"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                      placeholder="john@example.com"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                      placeholder="+1 234 567 890"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                      placeholder="123 Main St"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* City and Country */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                      placeholder="USA"
                    />
                  </div>
                </div>

                {/* Zip Code */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                    placeholder="10001"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                      placeholder="••••••••"
                      disabled={loading}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        password.length >= 6 ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <span
                      className={
                        password.length >= 6
                          ? "text-green-600"
                          : "text-gray-500"
                      }
                    >
                      6+ characters
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        /\d/.test(password) ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <span
                      className={
                        /\d/.test(password) ? "text-green-600" : "text-gray-500"
                      }
                    >
                      Number
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        /[a-zA-Z]/.test(password)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span
                      className={
                        /[a-zA-Z]/.test(password)
                          ? "text-green-600"
                          : "text-gray-500"
                      }
                    >
                      Letter
                    </span>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 ${
                        confirmPassword && password !== confirmPassword
                          ? "border-red-300 bg-red-50/50"
                          : confirmPassword && password === confirmPassword
                          ? "border-green-300 bg-green-50/50"
                          : "border-gray-200"
                      }`}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword &&
                    password === confirmPassword &&
                    password.length >= 6 && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Passwords match
                      </p>
                    )}
                </div>
              </>
            )}

            {/* Step 2: Role Specific Information */}
            {currentStep === 2 && (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {role === "customer"
                    ? "Account Details"
                    : "Professional Information"}
                </h2>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    I am a <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("customer")}
                      disabled={loading}
                      className={`
                        p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                        ${
                          role === "customer"
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md"
                            : "border-gray-200 hover:border-indigo-200 bg-white/50 text-gray-600 hover:text-indigo-600"
                        }
                        ${loading ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <ShoppingBag className="w-6 h-6" />
                      <span className="font-medium text-sm">Customer</span>
                      <span className="text-xs opacity-80">
                        I need a service
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("worker")}
                      disabled={loading}
                      className={`
                        p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                        ${
                          role === "worker"
                            ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md"
                            : "border-gray-200 hover:border-purple-200 bg-white/50 text-gray-600 hover:text-purple-600"
                        }
                        ${loading ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <Briefcase className="w-6 h-6" />
                      <span className="font-medium text-sm">Worker</span>
                      <span className="text-xs opacity-80">
                        I offer services
                      </span>
                    </button>
                  </div>
                </div>

                {/* Customer Fields */}
                {role === "customer" && (
                  <>
                    {/* Account Type */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Account Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setAccountType("homeowner")}
                          disabled={loading}
                          className={`
                            p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                            ${
                              accountType === "homeowner"
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md"
                                : "border-gray-200 hover:border-indigo-200 bg-white/50 text-gray-600 hover:text-indigo-600"
                            }
                          `}
                        >
                          <Home className="w-6 h-6" />
                          <span className="font-medium text-sm">Homeowner</span>
                          <span className="text-xs opacity-80">
                            Personal use
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountType("smallbusiness")}
                          disabled={loading}
                          className={`
                            p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                            ${
                              accountType === "smallbusiness"
                                ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md"
                                : "border-gray-200 hover:border-purple-200 bg-white/50 text-gray-600 hover:text-purple-600"
                            }
                          `}
                        >
                          <Building2 className="w-6 h-6" />
                          <span className="font-medium text-sm">Business</span>
                          <span className="text-xs opacity-80">
                            Company account
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Business Fields */}
                    {accountType === "smallbusiness" && (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Company Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Acme Inc."
                            disabled={loading}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Business Phone
                            </label>
                            <input
                              type="tel"
                              value={companyPhone}
                              onChange={(e) => setCompanyPhone(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="+1 234 567 890"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Business Email
                            </label>
                            <input
                              type="email"
                              value={companyEmail}
                              onChange={(e) => setCompanyEmail(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="contact@acme.com"
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Business Address{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="456 Business Ave"
                            disabled={loading}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Business City{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={businessCity}
                              onChange={(e) => setBusinessCity(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Los Angeles"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Business Country
                            </label>
                            <input
                              type="text"
                              value={businessCountry}
                              onChange={(e) =>
                                setBusinessCountry(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="USA"
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Business Zip Code
                            </label>
                            <input
                              type="text"
                              value={businessZipCode}
                              onChange={(e) =>
                                setBusinessZipCode(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="90210"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Website
                            </label>
                            <input
                              type="url"
                              value={businessWebsite}
                              onChange={(e) =>
                                setBusinessWebsite(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="https://acme.com"
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Registration Number
                            </label>
                            <input
                              type="text"
                              value={businessRegistrationNumber}
                              onChange={(e) =>
                                setBusinessRegistrationNumber(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="12345678"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Tax ID
                            </label>
                            <input
                              type="text"
                              value={taxId}
                              onChange={(e) => setTaxId(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="12-3456789"
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Year Founded
                            </label>
                            <input
                              type="number"
                              value={businessYearFounded}
                              onChange={(e) =>
                                setBusinessYearFounded(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="2020"
                              min="1900"
                              max={new Date().getFullYear()}
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Employees
                            </label>
                            <select
                              value={businessEmployeesCount}
                              onChange={(e) =>
                                setBusinessEmployeesCount(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                              disabled={loading}
                            >
                              <option value="1-10">1-10 employees</option>
                              <option value="11-50">11-50 employees</option>
                              <option value="51-200">51-200 employees</option>
                              <option value="200+">200+ employees</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Business Description
                          </label>
                          <textarea
                            value={businessDescription}
                            onChange={(e) =>
                              setBusinessDescription(e.target.value)
                            }
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Describe your business..."
                            disabled={loading}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Worker Fields */}
                {role === "worker" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Job Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Electrician"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Trade Category <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={tradeCategory}
                          onChange={(e) => setTradeCategory(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Electrical"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Experience Level
                        </label>
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                          disabled={loading}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Rate Type
                        </label>
                        <select
                          value={rateType}
                          onChange={(e) =>
                            setRateType(e.target.value as typeof rateType)
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                          disabled={loading}
                        >
                          <option value="hourly">Hourly</option>
                          <option value="fixed">Fixed</option>
                          <option value="project">Project</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="50"
                        min="0"
                        step="0.01"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Skills <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), addSkill())
                          }
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., Plumbing"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={addSkill}
                          disabled={!skillInput.trim() || loading}
                          className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-1"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="hover:text-purple-600"
                                disabled={loading}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Terms and Conditions */}
                <label className="flex items-start gap-3 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </>
            )}

            {/* Message Display */}
            {message && (
              <div
                className={`
                  p-4 rounded-xl text-sm flex items-center gap-3
                  ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : ""
                  }
                  ${
                    message.type === "error"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : ""
                  }
                  ${
                    message.type === "warning"
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : ""
                  }
                  ${
                    message.type === "info"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : ""
                  }
                `}
              >
                {message.type === "success" && (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                )}
                {message.type === "error" && (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                {message.type === "warning" && (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                {message.type === "info" && (
                  <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`${
                  currentStep === 1 ? "w-full" : "flex-1"
                } py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    {currentStep === 1 ? (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Continue</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors"
              >
                Log in
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © 2026 HUSTLE. All rights reserved.
        </p>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
