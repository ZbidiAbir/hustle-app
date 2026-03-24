import { FileText, Briefcase, User } from "lucide-react";

export function Tabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: "proposal" | "job" | "worker") => void;
}) {
  const tabs = [
    { id: "proposal", label: "Proposal", icon: FileText },
    { id: "job", label: "Job Details", icon: Briefcase },
    { id: "worker", label: "Worker Profile", icon: User },
  ];

  return (
    <div className="mb-6 border-b bg-white rounded-t-xl">
      <nav className="flex gap-1 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() =>
                onTabChange(
                  //@ts-ignore

                  tab.id as typeof activeTab
                )
              }
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
