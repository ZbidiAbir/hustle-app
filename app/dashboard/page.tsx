"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "../components/NotificationBell";

type UserData = {
  email: string;
  full_name: string;
  role: string;
  created_at: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        router.push("/login");
        return;
      }

      // Récupérer les infos depuis les métadonnées
      setUser({
        email: authUser.email || "",
        full_name: authUser.user_metadata?.full_name || "Utilisateur",
        role: authUser.user_metadata?.role || "customer",
        created_at: authUser.created_at || new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hustle
              </h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {user?.role === "worker" ? "👷 Travailleur" : "🛒 Client"}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell /> {/* 👈 Ajouté ici */}
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">
            Bonjour {user?.full_name} ! 👋
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations utilisateur */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-3">Ton profil</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Nom:</span> {user?.full_name}
                </p>
                <p>
                  <span className="text-gray-500">Email:</span> {user?.email}
                </p>
                <p>
                  <span className="text-gray-500">Rôle:</span>{" "}
                  {user?.role === "worker" ? "Travailleur" : "Client"}
                </p>
                <p>
                  <span className="text-gray-500">Membre depuis:</span>{" "}
                  {new Date(user?.created_at || "").toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>

            {/* Actions rapides selon le rôle */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-3">
                Actions rapides
              </h3>
              <div className="space-y-2">
                {user?.role === "worker" ? (
                  <>
                    <Link
                      href="/worker/jobs"
                      className="block p-2 bg-white rounded border hover:border-blue-500 transition"
                    >
                      🔍 Voir les missions disponibles
                    </Link>
                    <Link
                      href="/worker/my-jobs"
                      className="block p-2 bg-white rounded border hover:border-blue-500 transition"
                    >
                      📋 Mes missions en cours
                    </Link>
                    <Link
                      href="/worker/applications"
                      className="block p-2 bg-white rounded border hover:border-purple-500 transition"
                    >
                      📝 Mes candidatures
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/customer/create-job"
                      className="block p-2 bg-white rounded border hover:border-blue-500 transition"
                    >
                      ➕ Publier une mission
                    </Link>
                    <Link
                      href="/customer/my-jobs"
                      className="block p-2 bg-white rounded border hover:border-blue-500 transition"
                    >
                      📋 Mes missions
                    </Link>
                    <Link
                      href="/customer/applications"
                      className="block p-2 bg-white rounded border hover:border-purple-500 transition"
                    >
                      👥 Candidatures reçues
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
