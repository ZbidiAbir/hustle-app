"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = "info",
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    console.log(`🔄 Toast mounted: ${message} (${type})`);

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        console.log(`⏰ Toast duration ended`);
        clearInterval(timer);
        setIsVisible(false);
        setTimeout(() => {
          console.log(`👋 Calling onClose for toast`);
          onClose();
        }, 300);
      }
    }, 100);

    return () => {
      console.log(`🧹 Cleaning up toast timer`);
      clearInterval(timer);
    };
  }, [duration, onClose, message, type]);

  const handleClose = () => {
    console.log(`✖️ Manual close of toast`);
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  };

  const colors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    warning: "bg-yellow-50 border-yellow-200",
  };

  const progressColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg shadow-lg border
        transition-all duration-300 ease-in-out w-80
        ${colors[type]}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${progressColors[type]} transition-all duration-100 ease-linear`}
        style={{ width: `${progress}%` }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">{icons[type]}</div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800">{message}</p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
