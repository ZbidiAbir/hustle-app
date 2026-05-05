import { BUCKETS, storagePaths } from "@/lib/storage/paths";
import { supabase } from "@/lib/supabase";

export const UploadAttachment = async (
  file: File,
  jobId: string,
  senderId: string,
) => {
  console.log(file);
  const filePath = storagePaths.attachment(jobId, senderId, file.name);

  const { data, error } = await supabase.storage
    .from(BUCKETS.messages)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  console.log(data, error);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(BUCKETS.messages)
    .getPublicUrl(data.path);

  console.log(urlData);

  return {
    url: urlData.publicUrl,
    path: data.path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
};
