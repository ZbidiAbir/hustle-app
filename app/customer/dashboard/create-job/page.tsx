"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "react-datepicker/dist/react-datepicker.css";

type FormData = {
  // Basic Information
  title: string;
  category: string;
  location: string;
  buildingAccess: string;
  description: string;

  // Project Details
  projectSize: string;
  urgency: "Immediate" | "Flexible" | "";
  date: Date | null;
  timeSlot: string;
  level: string;

  // Skills
  skills: string[];

  // Materials
  materialsProvided: boolean;

  // Pricing
  payType: "Fixed" | "Range" | "Hourly" | "";
  fixedRate: number;
  minRate: number;
  maxRate: number;
  hourlyRate: number;

  // Files
  coiFile: File | null;
  photos: File[];
};

export default function CreateJobPage() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    location: "",
    buildingAccess: "",
    description: "",
    projectSize: "",
    urgency: "",
    date: null,
    timeSlot: "",
    level: "",
    skills: [],
    materialsProvided: true,
    payType: "",
    fixedRate: 0,
    minRate: 0,
    maxRate: 0,
    hourlyRate: 0,
    coiFile: null,
    photos: [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const categories = [
    "Plumbing",
    "Electrical",
    "Painting",
    "Masonry",
    "Gardening",
    "Cleaning",
    "Moving",
    "Delivery",
    "Tutoring",
    "Repairs",
    "IT Support",
    "Other",
  ];

  const projectSizes = [
    "Small (under 2h)",
    "Medium (2-4h)",
    "Large (4-8h)",
    "Extra Large (8h+)",
  ];

  const timeSlots = [
    "Morning (8am-12pm)",
    "Afternoon (2pm-6pm)",
    "Evening (6pm-10pm)",
    "To be defined",
  ];

  const levels = ["Beginner", "Intermediate", "Expert", "No requirement"];

  // Progress calculation
  const calculateProgress = () => {
    let completed = 0;
    let total = 9;

    if (formData.title) completed++;
    if (formData.category) completed++;
    if (formData.location) completed++;
    if (formData.description) completed++;
    if (formData.projectSize) completed++;
    if (formData.urgency) completed++;
    if (formData.level) completed++;
    if (formData.payType) completed++;
    if (formData.coiFile) completed++;

    return Math.round((completed / total) * 100);
  };

  // Skill handlers
  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  // Photo handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (formData.photos.length + files.length > 5) {
      alert("Maximum 5 photos allowed");
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...validFiles],
    }));

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // COI handler
  const handleCOIUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large (max 5MB)");
      return;
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      alert("Unsupported format. Use PDF, JPEG, or PNG");
      return;
    }

    setFormData((prev) => ({ ...prev, coiFile: file }));
  };

  // File upload with better error handling
  const uploadFiles = async (jobId: string) => {
    const uploadedUrls: {
      coiUrl?: string;
      photoUrls: string[];
    } = {
      photoUrls: [],
    };

    // Upload COI if exists
    if (formData.coiFile) {
      try {
        const coiExt = formData.coiFile.name.split(".").pop();
        const coiFileName = `${jobId}/coi.${coiExt}`;

        const { error: coiError } = await supabase.storage
          .from("job-documents")
          .upload(coiFileName, formData.coiFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (coiError) {
          console.error("COI upload error:", coiError);
          throw new Error(`Failed to upload COI: ${coiError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("job-documents").getPublicUrl(coiFileName);
        uploadedUrls.coiUrl = publicUrl;
      } catch (error) {
        console.error("COI upload failed:", error);
        throw error;
      }
    }

    // Upload photos
    for (let i = 0; i < formData.photos.length; i++) {
      try {
        const file = formData.photos[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${jobId}/photos/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("job-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Photo upload error:", uploadError);
          throw new Error(
            `Failed to upload photo ${i + 1}: ${uploadError.message}`
          );
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("job-images").getPublicUrl(fileName);
        uploadedUrls.photoUrls.push(publicUrl);

        setUploadProgress(
          Math.round(((i + 1) / formData.photos.length) * 50) + 50
        );
      } catch (error) {
        console.error("Photo upload failed:", error);
        throw error;
      }
    }

    return uploadedUrls;
  };

  // Form validation
  const validateForm = (): boolean => {
    setError(null);

    if (!formData.title.trim()) {
      setError("Please enter a job title");
      return false;
    }

    if (!formData.category) {
      setError("Please select a category");
      return false;
    }

    if (!formData.location.trim()) {
      setError("Please enter a location");
      return false;
    }

    if (!formData.description.trim()) {
      setError("Please enter a job description");
      return false;
    }

    if (!formData.projectSize) {
      setError("Please select project size");
      return false;
    }

    if (!formData.urgency) {
      setError("Please select urgency");
      return false;
    }

    if (!formData.level) {
      setError("Please select required level");
      return false;
    }

    if (!formData.payType) {
      setError("Please select payment type");
      return false;
    }

    if (!saveAsDraft && !formData.coiFile) {
      setError("Please upload a Certificate of Insurance (COI)");
      return false;
    }

    // Validate payment amounts
    if (formData.payType === "Fixed" && formData.fixedRate <= 0) {
      setError("Please enter a valid fixed price");
      return false;
    }

    if (formData.payType === "Range") {
      if (formData.minRate <= 0 || formData.maxRate <= 0) {
        setError("Please enter valid minimum and maximum rates");
        return false;
      }
      if (formData.minRate >= formData.maxRate) {
        setError("Minimum rate must be less than maximum rate");
        return false;
      }
    }

    if (formData.payType === "Hourly" && formData.hourlyRate <= 0) {
      setError("Please enter a valid hourly rate");
      return false;
    }

    return true;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setError(null);
    setUploadProgress(0);

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError)
        throw new Error("Authentication error: " + userError.message);
      if (!user) throw new Error("Please login to post a job");

      // Prepare job data
      const jobData: any = {
        customer_id: user.id,
        title: formData.title.trim(),
        category: formData.category,
        location: formData.location.trim(),
        building_access: formData.buildingAccess.trim() || null,
        description: formData.description.trim(),
        project_size: formData.projectSize,
        urgency: formData.urgency,
        date: formData.date?.toISOString() || null,
        time_slot: formData.timeSlot || null,
        level_required: formData.level,
        skills: formData.skills.length > 0 ? formData.skills : null,
        materials_provided: formData.materialsProvided,
        pay_type: formData.payType,
        status: saveAsDraft ? "draft" : "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add payment details based on type
      if (formData.payType === "Fixed") {
        jobData.fixed_rate = formData.fixedRate;
      } else if (formData.payType === "Range") {
        jobData.min_rate = formData.minRate;
        jobData.max_rate = formData.maxRate;
      } else if (formData.payType === "Hourly") {
        jobData.hourly_rate = formData.hourlyRate;
      }

      console.log("Creating job with data:", jobData);

      // Insert job
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert([jobData])
        .select()
        .single();

      if (jobError) {
        console.error("Job creation error:", jobError);
        throw new Error(`Failed to create job: ${jobError.message}`);
      }

      console.log("Job created successfully:", job);

      // Upload files if any
      if (formData.coiFile || formData.photos.length > 0) {
        try {
          setUploadProgress(10);
          const uploadedUrls = await uploadFiles(job.id);
          setUploadProgress(100);

          // Update job with file URLs
          const updateData: any = {};
          if (uploadedUrls.coiUrl) updateData.coi_url = uploadedUrls.coiUrl;
          if (uploadedUrls.photoUrls.length > 0)
            updateData.images = uploadedUrls.photoUrls;

          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from("jobs")
              .update(updateData)
              .eq("id", job.id);

            if (updateError) {
              console.error(
                "Failed to update job with file URLs:",
                updateError
              );
              // Don't throw, job was created successfully
            }
          }
        } catch (uploadError: any) {
          console.error("File upload error:", uploadError);
          // Job was created but files failed
          alert(
            `Warning: Job created but files failed to upload: ${uploadError.message}`
          );
        }
      }

      // Success!
      const successMessage = saveAsDraft
        ? "✅ Draft saved successfully!"
        : "✅ Job posted successfully!";
      alert(successMessage);

      // Redirect
      router.push("/customer/dashboard/my-jobs");
    } catch (error: any) {
      console.error("❌ Error in form submission:", error);
      setError(
        error.message || "An unexpected error occurred. Please try again."
      );
      alert(
        `Error: ${error.message || "Please check your inputs and try again."}`
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Handle draft save
  const handleSaveDraft = async () => {
    setSaveAsDraft(true);
    // Create a synthetic event
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(syntheticEvent);
    setSaveAsDraft(false);
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br p-4">
      <div className="">
        {/* Header with Progress */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Post a Job
          </h1>
          <p className="text-gray-600 mb-4">
            Fill in the details to find the perfect professional for your
            project
          </p>

          {/* Progress Bar */}
          <div className="bg-white rounded-full h-3 overflow-hidden shadow-sm">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">Completion: {progress}%</p>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                Uploading files: {uploadProgress}%
              </p>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Section 1: Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Basic Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., Kitchen Faucet Repair"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Full address"
                  />
                </div>

                {/* Building Access */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Access
                  </label>
                  <textarea
                    value={formData.buildingAccess}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buildingAccess: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Access code, buzzer, floor..."
                    rows={2}
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Describe the work to be done in detail..."
                    rows={5}
                    maxLength={500}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {formData.description.length}/500 characters
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Project Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                  2
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Project Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.projectSize}
                    onChange={(e) =>
                      setFormData({ ...formData, projectSize: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select</option>
                    {projectSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-6 bg-gray-50 p-3 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        value="Immediate"
                        checked={formData.urgency === "Immediate"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            urgency: e.target.value as "Immediate" | "Flexible",
                          })
                        }
                        className="w-4 h-4 text-purple-600"
                      />
                      <span>Immediate</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        value="Flexible"
                        checked={formData.urgency === "Flexible"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            urgency: e.target.value as "Immediate" | "Flexible",
                          })
                        }
                        className="w-4 h-4 text-purple-600"
                      />
                      <span>Flexible</span>
                    </label>
                  </div>
                </div>

                {/* Date */}
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.date?.toISOString().split("T")[0] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                    min={new Date().toISOString().split("T")[0]} // 👈 Ajoutez cette ligne
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Time Slot */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slot
                  </label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) =>
                      setFormData({ ...formData, timeSlot: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Required Level */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select</option>
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Skills */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                  3
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Required Skills
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addSkill())
                    }
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., Plumbing, Electrical..."
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-xl hover:from-purple-700 hover:to-purple-700 transition-all font-medium shadow-md hover:shadow-lg"
                  >
                    Add
                  </button>
                </div>

                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="group px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-50 text-purple-700 rounded-full text-sm flex items-center gap-2 border border-purple-200 hover:border-purple-300 transition-all"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-purple-400 hover:text-purple-600 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Materials */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                  4
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Materials & Equipment
                </h2>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Material Supply
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="materials"
                      checked={formData.materialsProvided}
                      onChange={() =>
                        setFormData({ ...formData, materialsProvided: true })
                      }
                      className="w-4 h-4 text-purple-600"
                    />
                    <span>I provide materials</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="materials"
                      checked={!formData.materialsProvided}
                      onChange={() =>
                        setFormData({ ...formData, materialsProvided: false })
                      }
                      className="w-4 h-4 text-purple-600"
                    />
                    <span>Worker brings materials</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 5: Documents */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                  5
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Documents
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* COI */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate of Insurance (COI){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-purple-400 transition-all bg-gray-50">
                    <input
                      type="file"
                      accept=".pdf,.jpeg,.jpg,.png"
                      onChange={handleCOIUpload}
                      className="hidden"
                      id="coi-upload"
                    />
                    <label
                      htmlFor="coi-upload"
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                        <svg
                          className="w-6 h-6 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                      </div>
                      <span className="text-purple-600 font-medium hover:text-purple-700">
                        Upload document
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      PDF, JPEG, PNG (max 5MB)
                    </p>
                    {formData.coiFile && (
                      <p className="text-sm text-green-600 mt-2 bg-green-50 p-2 rounded-lg">
                        ✓ {formData.coiFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Photos */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Photos
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-purple-400 transition-all bg-gray-50">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photos-upload"
                    />
                    <label
                      htmlFor="photos-upload"
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                        <svg
                          className="w-6 h-6 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                      <span className="text-purple-600 font-medium hover:text-purple-700">
                        Add photos
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      JPEG, PNG (max 5MB, 5 photos max)
                    </p>
                  </div>

                  {photoPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {photoPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:border-purple-400 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 6: Payment */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                  6
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Payment
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: "Fixed", label: "Fixed Price" },
                      { value: "Range", label: "Price Range" },
                      { value: "Hourly", label: "Hourly Rate" },
                    ].map((type) => (
                      <label
                        key={type.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="payType"
                          value={type.value}
                          checked={formData.payType === type.value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              payType: e.target.value as
                                | "Fixed"
                                | "Range"
                                | "Hourly",
                            })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.payType === "Fixed" && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fixed Price ($) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.fixedRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fixedRate: parseFloat(e.target.value),
                          })
                        }
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="150.00"
                      />
                    </div>
                  </div>
                )}

                {formData.payType === "Range" && (
                  <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum ($) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.minRate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              minRate: parseFloat(e.target.value),
                            })
                          }
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum ($) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.maxRate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxRate: parseFloat(e.target.value),
                            })
                          }
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.payType === "Hourly" && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate ($/h) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.hourlyRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hourlyRate: parseFloat(e.target.value),
                          })
                        }
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="25.00"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cancellation Policy Note */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Cancellation Policy</p>
                  <p>
                    You can cancel an open job for free. Cancellations less than
                    2 hours before the scheduled start time will incur a €25
                    fee.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && uploadProgress === 0
                  ? "Saving..."
                  : "Save as Draft"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-700 disabled:opacity-50 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {uploadProgress > 0
                      ? `Uploading... ${uploadProgress}%`
                      : "Posting..."}
                  </span>
                ) : (
                  "Post Job"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
