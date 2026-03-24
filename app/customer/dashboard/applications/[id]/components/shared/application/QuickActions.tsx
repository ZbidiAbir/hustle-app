import { MessageCircle, Briefcase, Phone, Calendar } from "lucide-react";

export function QuickActions({
  onMessage,
  onViewJob,
  phone,
}: {
  onMessage: () => void;
  onViewJob: () => void;
  phone?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <button
        onClick={onMessage}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 shadow-md"
      >
        <MessageCircle className="w-4 h-4" />
        Message Worker
      </button>
      <button
        onClick={onViewJob}
        className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 border shadow-sm"
      >
        <Briefcase className="w-4 h-4" />
        View Job
      </button>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 border shadow-sm"
        >
          <Phone className="w-4 h-4" />
          Call
        </a>
      )}
      <button className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 border shadow-sm">
        <Calendar className="w-4 h-4" />
        Schedule
      </button>
    </div>
  );
}
