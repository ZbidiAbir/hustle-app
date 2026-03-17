import { X } from "lucide-react";

interface ImageModalProps {
  image: string | null;
  onClose: () => void;
}

export function ImageModal({ image, onClose }: ImageModalProps) {
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-full">
        <img
          src={image}
          alt="Full size"
          className="max-w-full max-h-[90vh] object-contain"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
