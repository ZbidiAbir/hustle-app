interface JobSkillsProps {
  skills: string[];
}

export function JobSkills({ skills }: JobSkillsProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        Skills Required
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span
            key={idx}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
