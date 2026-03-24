"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Check if user just registered
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      setMessage({
        text: "✅ Registration successful! Please log in.",
        type: "success",
      });
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage({
        text: "❌ Email and password are required",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setMessage({ text: "Logging in...", type: "info" });

    try {
      // 1. Se connecter avec email et mot de passe
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Récupérer le rôle depuis la table profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user?.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // Si erreur, utiliser le rôle par défaut
        const role = "customer";
        setMessage({
          text: "✅ Login successful! Redirecting...",
          type: "success",
        });
        setTimeout(() => {
          router.push(`/${role}/dashboard`);
        }, 1500);
        return;
      }

      const role = profileData?.role || "customer";

      console.log("User role from profiles:", role); // Debug log

      setMessage({
        text: "✅ Login successful! Redirecting...",
        type: "success",
      });

      // 3. Rediriger vers le dashboard approprié
      setTimeout(() => {
        if (role === "worker") {
          router.push("/worker/dashboard");
        } else if (role === "customer") {
          router.push("/customer/dashboard");
        } else if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      }, 1500);
    } catch (error: any) {
      setMessage({
        text: `❌ ${error.message}`,
        type: "error",
      });
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            HUSTLE
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Please log in to your account
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-6"
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
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

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`
                  p-4 rounded-xl text-sm flex items-center gap-2
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
                    message.type === "info"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : ""
                  }
                `}
              >
                <span>{message.text}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Log In</span>
                </>
              )}
            </button>

            {/* Sign Up Link */}
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors"
              >
                Sign up
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
