import { ReactNode } from "react";

interface ChatLayoutProps {
  sidebar: ReactNode;
  chatArea: ReactNode;
  showMobileList: boolean;
}

export function ChatLayout({
  sidebar,
  chatArea,
  showMobileList,
}: ChatLayoutProps) {
  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <div
        className={`${
          showMobileList ? "flex" : "hidden"
        } md:flex w-full md:w-80 lg:w-96 flex-col border-r border-gray-200 bg-white absolute md:relative z-10 h-full`}
      >
        {sidebar}
      </div>

      {/* Chat Area */}
      <div
        className={`${
          !showMobileList ? "flex" : "hidden"
        } md:flex flex-1 flex-col bg-gray-50`}
      >
        {chatArea}
      </div>
    </div>
  );
}
