interface JobImagesProps {
  images: string[];
  onImageClick: (image: string) => void;
}

export function JobImages({ images, onImageClick }: JobImagesProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="relative">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-gray-50">
        {images.slice(0, 4).map((img, idx) => (
          <div
            key={idx}
            className="relative group cursor-pointer"
            onClick={() => onImageClick(img)}
          >
            <img
              src={img}
              alt={`Job photo ${idx + 1}`}
              className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:opacity-90 transition"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
