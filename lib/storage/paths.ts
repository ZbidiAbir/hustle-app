export const BUCKETS = {
  messages: "messages",
} as const;

export const storagePaths = {
  voice: (jobId: string, senderId: string) =>
    `${jobId}/${senderId}/voices/${Date.now()}.webm`,

  attachment: (jobId: string, senderId: string, fileName: string) =>
    `${jobId}/${senderId}/attachments/${Date.now()}-${fileName}`,
};
