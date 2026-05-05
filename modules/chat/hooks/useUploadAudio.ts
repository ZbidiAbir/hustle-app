import { BUCKETS, storagePaths } from "@/lib/storage/paths";
import { supabase } from "@/lib/supabase";

export const uploadAudioBlob = async (
  blob: Blob,
  jobId: string,
  senderId: string,
) => {
  const filePath = storagePaths.voice(jobId, senderId);

  const { data, error } = await supabase.storage
    .from(BUCKETS.messages)
    .upload(filePath, blob, {
      contentType: "audio/webm",
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(BUCKETS.messages)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    fileName: data.path.split("/").pop(),
    fileSize: blob.size,
    mimeType: blob.type,
    blob: blob,
    duration: null,
  };
};
