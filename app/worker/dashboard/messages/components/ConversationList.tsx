import { Conversation } from "@/types/chat";
import { ConversationItem } from "./ConversationItem";
import { Search, RefreshCw, Loader2 } from "lucide-react";
import { EmptyConversations } from "./EmptyConversations";

interface ConversationListProps {
  conversations: Conversation[];
  filteredConversations: Conversation[];
  selectedId: string | null;
  currentUserId: string;
  searchTerm: string;
  loading: boolean;
  isRefreshing: boolean;
  onSearchChange: (term: string) => void;
  onSelect: (conversation: Conversation) => void;
  onRefresh: () => void;
  onCloseMobile?: () => void;
}

export function ConversationList({
  conversations,
  filteredConversations,
  selectedId,
  currentUserId,
  searchTerm,
  loading,
  isRefreshing,
  onSearchChange,
  onSelect,
  onRefresh,
  onCloseMobile,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <EmptyConversations />
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">
              No conversations match your search
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedId === conv.id}
              currentUserId={currentUserId}
              onSelect={() => {
                onSelect(conv);
                onCloseMobile?.();
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
