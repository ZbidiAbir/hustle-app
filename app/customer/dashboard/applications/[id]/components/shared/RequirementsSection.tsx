export function RequirementsSection({
  requirements,
}: {
  requirements?: string[];
}) {
  if (!requirements || requirements.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Requirements</h4>
      <ul className="space-y-2">
        {requirements.map((req, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
            {req}
          </li>
        ))}
      </ul>
    </div>
  );
}
