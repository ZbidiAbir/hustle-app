"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { ChatLayout } from "./components/ChatLayout";
import { ConversationList } from "./components/ConversationList";
import { ChatArea } from "./components/ChatArea";
import { LoadingState } from "./components/LoadingState";
import { Conversation } from "@/types/chat";
import { useConversations } from "@/lib/hooks/useConversations";
import { useMessages } from "@/lib/hooks/useMessages";

export default function WorkerChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
    };
    getUser();
  }, [router]);

  const {
    conversations,
    filteredConversations,
    loading: conversationsLoading,
    isRefreshing,
    searchTerm,
    setSearchTerm,
    fetchConversations,
  } = useConversations(currentUser?.id || "");

  const {
    messages,
    loading: messagesLoading,
    sending,
    messagesEndRef,
    sendMessage,
  } = useMessages(
    selectedConversation?.jobId || "",
    currentUser?.id || "",
    selectedConversation?.customer?.full_name || "Customer"
  );

  // If jobId is provided in URL, select that conversation
  useEffect(() => {
    if (jobId && conversations.length > 0) {
      const conversation = conversations.find((c) => c.id === jobId);
      if (conversation) {
        setSelectedConversation(conversation);
        setShowMobileList(false);
      }
    }
  }, [jobId, conversations]);

  if (conversationsLoading) {
    return <LoadingState />;
  }

  return (
    <ChatLayout
      sidebar={
        <ConversationList
          conversations={conversations}
          filteredConversations={filteredConversations}
          selectedId={selectedConversation?.id || null}
          currentUserId={currentUser?.id || ""}
          searchTerm={searchTerm}
          loading={conversationsLoading}
          isRefreshing={isRefreshing}
          onSearchChange={setSearchTerm}
          onSelect={(conv) => {
            setSelectedConversation(conv);
            setShowCompanyDetails(false);
          }}
          onRefresh={() => fetchConversations(true)}
          onCloseMobile={() => setShowMobileList(false)}
        />
      }
      chatArea={
        <ChatArea
          conversation={selectedConversation}
          customer={selectedConversation?.customer || null}
          messages={messages}
          loading={messagesLoading}
          sending={sending}
          currentUserId={currentUser?.id || ""}
          //@ts-ignore
          messagesEndRef={messagesEndRef}
          onSendMessage={sendMessage}
          onBack={() => setShowMobileList(true)}
          onInfoClick={() => setShowCompanyDetails(!showCompanyDetails)}
          showCompanyDetails={showCompanyDetails}
          onToggleCompanyDetails={() =>
            setShowCompanyDetails(!showCompanyDetails)
          }
        />
      }
      showMobileList={showMobileList}
    />
  );
}
