import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Conversation, Message } from "@/types/messages.types";
import { messageService } from "../messages.service";
import { getCurrentUser } from "../common/currentUser";

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const subscriptionRef = useRef<any>(null);
  const router = useRouter();

  // Initialisation
  useEffect(() => {
    init();
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const init = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      await loadConversations(user.id);
    } catch (err) {
      setError("Erreur lors de l'initialisation");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les conversations
  const loadConversations = async (userId: string) => {
    try {
      const data = await messageService.fetchConversations(userId);
      setConversations(data);

      // Sélectionner automatiquement la première conversation
      if (data.length > 0 && !selectedConversation) {
        selectConversation(data[0]);
      }
    } catch (err) {
      setError("Erreur lors du chargement des conversations");
      console.error(err);
    }
  };

  // Rafraîchir les conversations
  const refreshConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await messageService.fetchConversations(currentUser.id);
      setConversations(data);
    } catch (err) {
      console.error("Erreur lors du rafraîchissement", err);
    }
  }, [currentUser]);

  // Sélectionner une conversation
  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    if (!currentUser) return;

    try {
      // Charger les messages
      const messagesData = await messageService.fetchMessages(
        conversation.id,
        currentUser.id,
      );

      // Ajouter les noms des expéditeurs
      const messagesWithSenders = messagesData.map((msg) => ({
        ...msg,
        sender_name:
          msg.sender_id === currentUser.id
            ? "You"
            : conversation.otherUser.full_name,
        sender_avatar:
          msg.sender_id === currentUser.id
            ? undefined
            : conversation.otherUser.avatar_url,
      }));

      setMessages(
        //@ts-ignore
        messagesWithSenders,
      );

      // Marquer comme lu
      await messageService.markMessagesAsRead(conversation.id, currentUser.id);

      // Mettre à jour le compteur dans la liste
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, unreadCount: 0 } : c,
        ),
      );

      // S'abonner aux nouveaux messages
      setupMessageSubscription(conversation);
    } catch (err) {
      setError("Erreur lors du chargement des messages");
      console.error(err);
    }
  };

  // Configuration de l'abonnement aux messages
  const setupMessageSubscription = (conversation: Conversation) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = messageService.subscribeToMessages(
      conversation.id,
      async (newMsg) => {
        // Marquer comme lu si c'est de l'autre utilisateur
        if (newMsg.sender_id !== currentUser?.id) {
          await messageService.markMessagesAsRead(
            conversation.id,
            currentUser.id,
          );
        }

        // Ajouter le message
        setMessages((prev) => [
          ...prev,
          {
            ...newMsg,
            sender_name:
              newMsg.sender_id === currentUser?.id
                ? "You"
                : conversation.otherUser.full_name,
            sender_avatar:
              newMsg.sender_id === currentUser?.id
                ? undefined
                : conversation.otherUser.avatar_url,
          },
        ]);

        // Rafraîchir la liste des conversations
        refreshConversations();
      },
    );
  };

  // Envoyer un message
  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation || !currentUser) return;

    setSending(true);
    try {
      await messageService.sendMessage({
        job_id: selectedConversation.id,
        sender_id: currentUser.id,
        content: content.trim(),
        read: false,
      });
    } catch (err) {
      setError("Erreur lors de l'envoi du message");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return {
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    currentUser,
    error,
    selectConversation,
    sendMessage,
    refreshConversations,
  };
};
