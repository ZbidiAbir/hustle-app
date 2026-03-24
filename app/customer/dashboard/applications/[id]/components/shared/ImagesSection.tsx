export function ImagesSection({
  images,
  expanded,
}: {
  images?: string[];
  expanded?: boolean;
}) {
  if (!images || images.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        Photos ({images.length})
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.slice(0, expanded ? undefined : 3).map((img, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-lg overflow-hidden border group cursor-pointer hover:shadow-lg transition"
          >
            <img
              src={img}
              alt={`Job image ${i + 1}`}
              className="w-full h-full object-cover transition group-hover:scale-110"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
