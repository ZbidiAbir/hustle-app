import { BUCKETS, storagePaths } from "@/lib/storage/paths";
import { supabase } from "@/lib/supabase";

export const UploadAttachment = async (
  file: File,
  jobId: string,
  senderId: string,
) => {
  const filePath = storagePaths.attachment(jobId, senderId, file.name);

  const { data, error } = await supabase.storage
    .from(BUCKETS.messages)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(BUCKETS.messages)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
};
