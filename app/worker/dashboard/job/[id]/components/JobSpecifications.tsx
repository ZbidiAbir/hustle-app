import { Job } from "@/types/job";
import { getProjectSizeIcon } from "@/utils/jobDetail.utils";
import { Award, Package, Building2 } from "lucide-react";
interface JobSpecificationsProps {
  job: Job;
}

export function JobSpecifications({ job }: JobSpecificationsProps) {
  const specs = [];

  if (job.project_size) {
    specs.push(
      <div key="size" className="flex items-center gap-2 text-sm">
        {getProjectSizeIcon(job.project_size)}
        <span className="text-gray-600">Size: </span>
        <span className="font-medium text-gray-900 capitalize">
          {job.project_size}
        </span>
      </div>
    );
  }

  if (job.level_required) {
    specs.push(
      <div key="level" className="flex items-center gap-2 text-sm">
        <Award className="w-4 h-4 text-purple-500" />
        <span className="text-gray-600">Level: </span>
        <span className="font-medium text-gray-900 capitalize">
          {job.level_required}
        </span>
      </div>
    );
  }

  if (job.materials_provided !== undefined) {
    specs.push(
      <div key="materials" className="flex items-center gap-2 text-sm">
        <Package className="w-4 h-4 text-blue-500" />
        <span className="text-gray-600">Materials: </span>
        <span className="font-medium text-gray-900">
          {job.materials_provided ? "Provided" : "BYO materials"}
        </span>
      </div>
    );
  }

  if (job.building_access) {
    specs.push(
      <div key="access" className="flex items-center gap-2 text-sm">
        <Building2 className="w-4 h-4 text-gray-500" />
        <span className="text-gray-600">Access: </span>
        <span className="font-medium text-gray-900">{job.building_access}</span>
      </div>
    );
  }

  if (specs.length === 0) return null;

  return <div className="grid grid-cols-2 gap-4 mb-6">{specs}</div>;
}
