interface JobDescriptionProps {
  description: string;
}

export function JobDescription({ description }: JobDescriptionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {description}
      </p>
    </div>
  );
}
