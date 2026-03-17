import { Send, Loader2 } from "lucide-react";

interface ApplicationFormProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ApplicationForm({
  message,
  onMessageChange,
  onSubmit,
  isSubmitting,
}: ApplicationFormProps) {
  return (
    <div className="space-y-4">
      {/* Message Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message to Client <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Introduce yourself and explain why you're a good fit for this job. Share your relevant experience and skills..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {message.length}/500 characters
        </p>
      </div>

      {/* Apply Button */}
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Apply Now
          </>
        )}
      </button>
    </div>
  );
}
