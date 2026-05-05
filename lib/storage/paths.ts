export const BUCKETS = {
  messages: "messages",
} as const;

export const storagePaths = {
  voice: (conversationId: string, senderId: string) =>
    `${conversationId}/${senderId}/voices/${Date.now()}.webm`,

  attachment: (conversationId: string, senderId: string, fileName: string) =>
    `${conversationId}/${senderId}/attachments/${Date.now()}-${fileName}`,
};
