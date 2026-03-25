// components/admin/StatCard.tsx
"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: StatCardProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{title}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);
