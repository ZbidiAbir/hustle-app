"use client";

import { useState, useEffect, useRef } from "react";

import { Search, MessageSquare } from "lucide-react";
import { useMessages } from "@/lib/hooks/useCustomerMessages";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { EmptyState } from "./components/EmptyState";
import { ConversationItem } from "./components/ConversationItem";
import { ChatHeader } from "./components/ChatHeader";
import { JobInfoBar } from "./components/JobInfoBar";
import { MessageBubble } from "./components/MessageBubble";
import { MessageInput } from "./components/MessageInput";

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    currentUser,
    error,
    selectConversation,
    sendMessage,
  } = useMessages();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return <EmptyState title="Une erreur est survenue" description={error} />;
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      //@ts-ignore
      conv?.otherUser?.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleSelectConversation = (conversation: any) => {
    selectConversation(conversation);
    setShowMobileList(false);
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div className="h-screen flex bg-white">
      {/* Conversations Sidebar */}
      <div
        className={`${
          showMobileList ? "flex" : "hidden"
        } md:flex w-full md:w-80 lg:w-96 flex-col border-r border-gray-200 bg-white absolute md:relative z-10 h-full`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            Messages(Asigned Workers)
          </h1>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedConversation?.id === conv.id}
                currentUserId={currentUser?.id}
                onSelect={() => handleSelectConversation(conv)}
              />
            ))
          ) : (
            <EmptyState
              title="No conversations yet"
              description="When you have active jobs with workers, they'll appear here"
              icon={<MessageSquare className="w-12 h-12 text-gray-300" />}
            />
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`${
          !showMobileList ? "flex" : "hidden"
        } md:flex flex-1 flex-col bg-gray-50`}
      >
        {selectedConversation && currentUser ? (
          <>
            <ChatHeader
              conversation={selectedConversation}
              onBack={() => setShowMobileList(true)}
            />

            <JobInfoBar conversation={selectedConversation} />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const isMine = message.sender_id === currentUser.id;
                const showAvatar =
                  !isMine &&
                  (index === 0 ||
                    messages[index - 1]?.sender_id !== message.sender_id);

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isMine={isMine}
                    otherUser={selectedConversation.otherUser}
                    showAvatar={showAvatar}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={sending}
            />
          </>
        ) : (
          <EmptyState
            title="Your Messages"
            description="Select a conversation from the list to start chatting"
          />
        )}
      </div>
    </div>
  );
}
