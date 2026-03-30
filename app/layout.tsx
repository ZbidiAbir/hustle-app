import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hustle - Plateforme de services",
  description: "Connectez talents et opportunités",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <AuthProvider>
        <body className={inter.className}>
          {" "}
          <ToastProvider>{children}</ToastProvider>
        </body>
      </AuthProvider>
    </html>
  );
}
