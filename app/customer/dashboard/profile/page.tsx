"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  CreditCard,
  Landmark,
  FileText,
  Save,
  Loader2,
  Calendar,
  Shield,
  AlertCircle,
  Upload,
  CheckCircle,
  Globe,
  Hash,
  Building,
  Home,
  Store,
  X,
} from "lucide-react";
import { useCustomerProfile } from "@/lib/hooks/useCustomerProfile";

export default function CustomerProfilePage() {
  const {
    profile,
    loading,
    saving,
    uploading,
    uploadingLogo,
    successMessage,
    errorMessage,
    updateBasicInfo,
    updateCompanyInfo,
    updatePaymentInfo,
    uploadAvatar,
    uploadCompanyLogo,
    removeAvatar,
    removeCompanyLogo,
  } = useCustomerProfile();

  const [activeTab, setActiveTab] = useState<
    "personal" | "company" | "payment"
  >("personal");

  // États pour les formulaires
  const [personalForm, setPersonalForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    zip_code: "",
  });

  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    company_phone: "",
    company_email: "",
    business_address: "",
    business_city: "",
    business_country: "",
    business_zip_code: "",
    tax_id: "",
    business_registration_number: "",
    business_website: "",
    business_description: "",
    business_year_founded: null as number | null,
    business_employees_count: "" as "1-10" | "11-50" | "51-200" | "200+" | "",
  });

  const [paymentForm, setPaymentForm] = useState({
    payment_method: "credit_card" as
      | "credit_card"
      | "debit_card"
      | "bank_transfer",
    card_last_four: "",
    card_expiry_date: "",
    card_holder_name: "",
    bank_name: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_routing_number: "",
  });

  // Mettre à jour les formulaires quand le profil est chargé
  useEffect(() => {
    if (profile) {
      setPersonalForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        country: profile.country || "",
        zip_code: profile.zip_code || "",
      });

      setCompanyForm({
        company_name: profile.company_name || "",
        company_phone: profile.company_phone || "",
        company_email: profile.company_email || "",
        business_address: profile.business_address || "",
        business_city: profile.business_city || "",
        business_country: profile.business_country || "",
        business_zip_code: profile.business_zip_code || "",
        tax_id: profile.tax_id || "",
        business_registration_number:
          profile.business_registration_number || "",
        business_website: profile.business_website || "",
        business_description: profile.business_description || "",
        business_year_founded: profile.business_year_founded || null,
        business_employees_count: profile.business_employees_count || "",
      });

      setPaymentForm({
        payment_method: profile.payment_method || "credit_card",
        card_last_four: profile.card_last_four || "",
        card_expiry_date: profile.card_expiry_date || "",
        card_holder_name: profile.card_holder_name || "",
        bank_name: profile.bank_name || "",
        bank_account_holder: profile.bank_account_holder || "",
        bank_account_number: profile.bank_account_number || "",
        bank_routing_number: profile.bank_routing_number || "",
      });

      // Debug: voir le type de compte
      console.log("Profile chargé:", profile);
      console.log("Account type:", profile?.account_type);
    }
  }, [profile]);

  const handlePersonalChange = (
    field: keyof typeof personalForm,
    value: string
  ) => {
    setPersonalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompanyChange = (field: keyof typeof companyForm, value: any) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field: keyof typeof paymentForm, value: any) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePersonalSubmit = async () => {
    await updateBasicInfo(personalForm);
  };

  const handleCompanySubmit = async () => {
    await updateCompanyInfo(
      //@ts-ignore
      companyForm
    );
  };

  const handlePaymentSubmit = async () => {
    await updatePaymentInfo(paymentForm);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  };

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadCompanyLogo(file);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "C";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAccountTypeIcon = () => {
    switch (profile?.account_type) {
      case "smallbusiness":
        return <Store className="w-4 h-4" />;
      case "homeowner":
        return <Home className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getAccountTypeLabel = () => {
    switch (profile?.account_type) {
      case "smallbusiness":
        return "Small Business";
      case "homeowner":
        return "Homeowner";
      default:
        return "Customer";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Messages de notification */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="  px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec profil */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Profile"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(profile?.full_name)
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-white" />
                )}
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
              {profile?.avatar_url && (
                <button
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                  title="Remove avatar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {profile?.full_name || "Customer Profile"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </span>
                {profile?.phone && (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {profile.phone}
                    </span>
                  </>
                )}
                {(profile?.city || profile?.country) && (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {[profile.city, profile.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium flex items-center gap-1">
                {getAccountTypeIcon()}
                {getAccountTypeLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs - TOUS LES ONGLETS SONT AFFICHÉS */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-1 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab("personal")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center gap-2 ${
                  activeTab === "personal"
                    ? "bg-white text-purple-600 border-t border-l border-r border-gray-200 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <User className="w-4 h-4" />
                Personal Info
              </button>

              {/* ONGLET COMPANY TOUJOURS VISIBLE */}
              <button
                onClick={() => setActiveTab("company")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center gap-2 ${
                  activeTab === "company"
                    ? "bg-white text-purple-600 border-t border-l border-r border-gray-200 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Company Info
              </button>

              <button
                onClick={() => setActiveTab("payment")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center gap-2 ${
                  activeTab === "payment"
                    ? "bg-white text-purple-600 border-t border-l border-r border-gray-200 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Payment Methods
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Personal Information
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Full Name"
                    value={personalForm.full_name}
                    onChange={(value: any) =>
                      handlePersonalChange("full_name", value)
                    }
                    placeholder="Your full name"
                    icon={<User className="w-4 h-4 text-gray-400" />}
                  />

                  <InputField
                    label="Email"
                    value={profile?.email || ""}
                    readOnly
                    icon={<Mail className="w-4 h-4 text-gray-400" />}
                  />

                  <InputField
                    label="Phone Number"
                    type="tel"
                    value={personalForm.phone}
                    onChange={(value: any) =>
                      handlePersonalChange("phone", value)
                    }
                    placeholder="+1 (555) 123-4567"
                    icon={<Phone className="w-4 h-4 text-gray-400" />}
                  />

                  <InputField
                    label="Address"
                    value={personalForm.address}
                    onChange={(value: any) =>
                      handlePersonalChange("address", value)
                    }
                    placeholder="123 Main St"
                    icon={<MapPin className="w-4 h-4 text-gray-400" />}
                  />

                  <InputField
                    label="City"
                    value={personalForm.city}
                    onChange={(value: any) =>
                      handlePersonalChange("city", value)
                    }
                    placeholder="New York"
                  />

                  <InputField
                    label="Country"
                    value={personalForm.country}
                    onChange={(value: any) =>
                      handlePersonalChange("country", value)
                    }
                    placeholder="United States"
                  />

                  <InputField
                    label="ZIP Code"
                    value={personalForm.zip_code}
                    onChange={(value: any) =>
                      handlePersonalChange("zip_code", value)
                    }
                    placeholder="10001"
                  />
                </div>

                <div className="flex justify-end">
                  <SaveButton
                    onClick={handlePersonalSubmit}
                    saving={saving}
                    text="Save Personal Info"
                    color="purple"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Company Info Tab - Affiche le formulaire OU un message selon le type de compte */}
          {activeTab === "company" && (
            <div className="p-6">
              {profile?.account_type === "smallbusiness" ? (
                /* FORMULAIRE COMPLET POUR SMALL BUSINESS */
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      Company Information
                    </h2>

                    {/* Company Logo Upload */}
                    <div className="flex items-center gap-4">
                      {profile?.company_logo_url && (
                        <div className="relative group">
                          <img
                            src={profile.company_logo_url}
                            alt="Company logo"
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          />
                          <button
                            onClick={removeCompanyLogo}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                            title="Remove logo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <label
                        htmlFor="company-logo-upload"
                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 cursor-pointer text-sm"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {profile?.company_logo_url
                          ? "Change Logo"
                          : "Upload Logo"}
                      </label>
                      <input
                        type="file"
                        id="company-logo-upload"
                        accept="image/*"
                        onChange={handleCompanyLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informations de base de l'entreprise */}
                      <InputField
                        label="Company Name *"
                        value={companyForm.company_name}
                        onChange={(value: any) =>
                          handleCompanyChange("company_name", value)
                        }
                        placeholder="Your company name"
                        icon={<Building className="w-4 h-4 text-gray-400" />}
                        required
                      />

                      <InputField
                        label="Company Phone"
                        type="tel"
                        value={companyForm.company_phone}
                        onChange={(value: any) =>
                          handleCompanyChange("company_phone", value)
                        }
                        placeholder="+1 (555) 123-4567"
                        icon={<Phone className="w-4 h-4 text-gray-400" />}
                      />

                      <InputField
                        label="Company Email"
                        type="email"
                        value={companyForm.company_email}
                        onChange={(value: any) =>
                          handleCompanyChange("company_email", value)
                        }
                        placeholder="contact@company.com"
                        icon={<Mail className="w-4 h-4 text-gray-400" />}
                      />

                      <InputField
                        label="Website"
                        value={companyForm.business_website}
                        onChange={(value: any) =>
                          handleCompanyChange("business_website", value)
                        }
                        placeholder="https://www.company.com"
                        icon={<Globe className="w-4 h-4 text-gray-400" />}
                      />

                      {/* Adresse de l'entreprise */}
                      <InputField
                        label="Business Address"
                        value={companyForm.business_address}
                        onChange={(value: any) =>
                          handleCompanyChange("business_address", value)
                        }
                        placeholder="123 Business Ave"
                        icon={<MapPin className="w-4 h-4 text-gray-400" />}
                      />

                      <InputField
                        label="Business City"
                        value={companyForm.business_city}
                        onChange={(value: any) =>
                          handleCompanyChange("business_city", value)
                        }
                        placeholder="New York"
                      />

                      <InputField
                        label="Business Country"
                        value={companyForm.business_country}
                        onChange={(value: any) =>
                          handleCompanyChange("business_country", value)
                        }
                        placeholder="United States"
                      />

                      <InputField
                        label="Business ZIP Code"
                        value={companyForm.business_zip_code}
                        onChange={(value: any) =>
                          handleCompanyChange("business_zip_code", value)
                        }
                        placeholder="10001"
                      />

                      {/* Informations légales */}
                      <InputField
                        label="Tax ID / VAT Number"
                        value={companyForm.tax_id}
                        onChange={(value: any) =>
                          handleCompanyChange("tax_id", value)
                        }
                        placeholder="12-3456789"
                        icon={<Hash className="w-4 h-4 text-gray-400" />}
                      />

                      <InputField
                        label="Business Registration Number"
                        value={companyForm.business_registration_number}
                        onChange={(value: any) =>
                          handleCompanyChange(
                            "business_registration_number",
                            value
                          )
                        }
                        placeholder="REG-123456"
                      />

                      {/* Description de l'entreprise - Pleine largeur */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Business Description
                        </label>
                        <textarea
                          value={companyForm.business_description}
                          onChange={(e) =>
                            handleCompanyChange(
                              "business_description",
                              e.target.value
                            )
                          }
                          rows={4}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                          placeholder="Describe your business, services, mission, etc..."
                        />
                      </div>

                      {/* Année de fondation */}
                      <SelectField
                        label="Year Founded"
                        value={
                          companyForm.business_year_founded?.toString() || ""
                        }
                        onChange={(value: any) =>
                          handleCompanyChange(
                            "business_year_founded",
                            value ? parseInt(value) : null
                          )
                        }
                        options={[
                          { value: "", label: "Select year" },
                          ...Array.from({ length: 50 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return {
                              value: year.toString(),
                              label: year.toString(),
                            };
                          }),
                        ]}
                      />

                      {/* Taille de l'entreprise */}
                      <SelectField
                        label="Company Size"
                        value={companyForm.business_employees_count}
                        onChange={(value: any) =>
                          handleCompanyChange("business_employees_count", value)
                        }
                        options={[
                          { value: "", label: "Select size" },
                          { value: "1-10", label: "1-10 employees" },
                          { value: "11-50", label: "11-50 employees" },
                          { value: "51-200", label: "51-200 employees" },
                          { value: "200+", label: "200+ employees" },
                        ]}
                      />

                      {/* Statut de vérification (lecture seule) */}
                      {profile?.business_verified && (
                        <div className="md:col-span-2">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-green-800">
                              Your business has been verified
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <SaveButton
                        onClick={handleCompanySubmit}
                        saving={saving}
                        text="Save Company Information"
                        color="purple"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* MESSAGE POUR LES HOMEOWNERS */
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Company Information
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    You are currently registered as a <strong>Homeowner</strong>
                    . If you own a business and want to register as a Small
                    Business, please contact our support team to upgrade your
                    account.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contact Support
                    </button>
                    <button className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                      Learn More
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === "payment" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Payment Methods
              </h2>

              <div className="space-y-6">
                {/* Payment Method Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PaymentMethodCard
                    type="credit_card"
                    label="Credit Card"
                    icon={<CreditCard className="w-6 h-6" />}
                    selected={paymentForm.payment_method === "credit_card"}
                    onSelect={() =>
                      handlePaymentChange("payment_method", "credit_card")
                    }
                  />
                  <PaymentMethodCard
                    type="debit_card"
                    label="Debit Card"
                    icon={<CreditCard className="w-6 h-6" />}
                    selected={paymentForm.payment_method === "debit_card"}
                    onSelect={() =>
                      handlePaymentChange("payment_method", "debit_card")
                    }
                  />
                  <PaymentMethodCard
                    type="bank_transfer"
                    label="Bank Transfer"
                    icon={<Landmark className="w-6 h-6" />}
                    selected={paymentForm.payment_method === "bank_transfer"}
                    onSelect={() =>
                      handlePaymentChange("payment_method", "bank_transfer")
                    }
                  />
                </div>

                {/* Card Details */}
                {(paymentForm.payment_method === "credit_card" ||
                  paymentForm.payment_method === "debit_card") && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      Card Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Card Holder Name"
                        value={paymentForm.card_holder_name}
                        onChange={(value: any) =>
                          handlePaymentChange("card_holder_name", value)
                        }
                        placeholder="John Doe"
                      />

                      <InputField
                        label="Card Number"
                        value={paymentForm.card_last_four}
                        onChange={(value: any) =>
                          handlePaymentChange("card_last_four", value)
                        }
                        placeholder="**** **** **** 1234"
                        maxLength={19}
                      />

                      <InputField
                        label="Expiry Date"
                        value={paymentForm.card_expiry_date}
                        onChange={(value: any) =>
                          handlePaymentChange("card_expiry_date", value)
                        }
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Your card information is securely stored
                    </p>
                  </div>
                )}

                {/* Bank Transfer Details */}
                {paymentForm.payment_method === "bank_transfer" && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-purple-600" />
                      Bank Account Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Bank Name"
                        value={paymentForm.bank_name}
                        onChange={(value: any) =>
                          handlePaymentChange("bank_name", value)
                        }
                        placeholder="Chase, Bank of America, etc."
                      />

                      <InputField
                        label="Account Holder Name"
                        value={paymentForm.bank_account_holder}
                        onChange={(value: any) =>
                          handlePaymentChange("bank_account_holder", value)
                        }
                        placeholder="John Doe"
                      />

                      <InputField
                        label="Account Number"
                        value={paymentForm.bank_account_number}
                        onChange={(value: any) =>
                          handlePaymentChange("bank_account_number", value)
                        }
                        placeholder="**** **** **** 1234"
                      />

                      <InputField
                        label="Routing Number"
                        value={paymentForm.bank_routing_number}
                        onChange={(value: any) =>
                          handlePaymentChange("bank_routing_number", value)
                        }
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <SaveButton
                    onClick={handlePaymentSubmit}
                    saving={saving}
                    text="Save Payment Info"
                    color="green"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Composants réutilisables
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  icon,
  maxLength,
  required = false,
}: any) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          maxLength={maxLength}
          required={required}
          className={`w-full ${
            icon ? "pl-10" : "px-4"
          } pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
            readOnly ? "bg-gray-50 cursor-not-allowed" : ""
          }`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
      >
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PaymentMethodCard({ type, label, icon, selected, onSelect }: any) {
  return (
    <button
      onClick={onSelect}
      className={`p-4 border rounded-lg transition flex flex-col items-center gap-2 ${
        selected
          ? "border-purple-500 bg-purple-50 text-purple-700"
          : "border-gray-200 hover:border-gray-300 text-gray-600"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function SaveButton({ onClick, saving, text, color = "purple" }: any) {
  const colors = {
    purple:
      "from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
    green:
      "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
  };

  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`px-6 py-2.5 bg-gradient-to-r text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2 shadow-sm`}
    >
      {saving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          {text}
        </>
      )}
    </button>
  );
}
