import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Mic, Plus, Trash } from "lucide-react";
import { useAudioRecorder } from "../worker/dashboard/messages/hooks/useAudioRecorder";
import { uploadAudioBlob } from "../worker/dashboard/messages/hooks/useUploadAudio";
import { AudioRecorderBar } from "../worker/dashboard/chat/[jobId]/components/AudioRecorderBar";
import clsx from "clsx";
import { UploadButton } from "./UploadButton";
import { UploadAttachment } from "../worker/dashboard/messages/hooks/useUploadAttachment";

interface MessageInputProps {
  onSendMessage: (
    content: string | null,
    type: "text" | "audio" | "attachement",
    file_url?: string,
    file_name?: string,
    file_size?: number,
  ) => Promise<void>;
  //   handleSendAudio: (
  //     audioBlob: Blob | null,
  //     duration: number,
  //     cancel: () => void,
  //     event?: React.SubmitEvent,
  //   ) => void;
  isSending: boolean;
  jobId: string;
  senderId: string;
  onTyping?: (isTyping: boolean) => void;
  //   selectedConversationId: string;
}

function MessageInput({
  isSending,
  jobId,
  senderId,
  //   onTyping,
  onSendMessage,
  //   handleSendAudio,
  //   selectedConversationId,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ Correction: initialisé à null

  const { duration, start, state, cancel, analyser, resume, pause, stop } =
    useAudioRecorder();
  const isRecording = state === "recording" || state === "paused";
  const canSend = message.trim().length > 0 || isSending || isRecording;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  //   const handleTyping = () => {
  //     if (onTyping) {
  //       onTyping(true);

  //       // ✅ Correction: vérification que typingTimeoutRef.current n'est pas null
  //       if (typingTimeoutRef.current) {
  //         clearTimeout(typingTimeoutRef.current);
  //       }

  //       typingTimeoutRef.current = setTimeout(() => {
  //         // onTyping(false);
  //         typingTimeoutRef.current = null; // ✅ Réinitialisation après exécution
  //       }, 1000);
  //     }
  //   };

  //   const handleSubmit = async (
  //     e: React.SubmitEvent | React.KeyboardEvent<HTMLInputElement>,
  //   ) => {
  //     e.preventDefault();

  //     console.log("this is the function");
  //     if (!message.trim() || isSending) return;
  //     if (isRecording) {
  //       console.log("i am here to send the audio");
  //       const blob = await stop();
  //       console.log("the recording clicked");
  //       // handleSendAudio(blob, duration, cancel);
  //       const returnedUrl = await uploadAudioBlob(blob, selectedConversationId);
  //       console.log(returnedUrl);
  //     } else {
  //       console.log("what i created i come insteady");
  //       //   await onSendMessage(message);
  //       setMessage("");
  //       if (onTyping) onTyping(false);

  //       // ✅ Nettoyer le timeout
  //       if (typingTimeoutRef.current) {
  //         clearTimeout(typingTimeoutRef.current);
  //         typingTimeoutRef.current = null;
  //       }

  //       inputRef.current?.focus();
  //     }
  //   };

  async function handleSelectFiles(files: FileList) {
    if (!files || files.length === 0) return;

    const file = files[0];

    const { url, fileName, fileSize } = await UploadAttachment(
      file,
      jobId,
      senderId,
    );

    await onSendMessage(null, "attachement", url, fileName, fileSize);
  }
  const handleSubmit = async (
    e: React.SubmitEvent | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();

    console.log("this is the function");
    // if (!message.trim() || isSending) return;
    const blob = await stop();
    console.log("the recording clicked");
    const { url, fileName, fileSize } = await uploadAudioBlob(
      blob,
      jobId,
      senderId,
    );
    console.log(url, fileName, fileSize);

    await onSendMessage(message, "audio", url, fileName, fileSize);
    setMessage("");
    // if (onTyping) onTyping(false);

    // ✅ Nettoyer le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    inputRef.current?.focus();
  };

  console.log(isRecording);

  return (
    <div className="bg-white border-t border-gray-200 p-4 w-full">
      <div className="">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 w-full"
        >
          <UploadButton onSelect={handleSelectFiles} />
          <button
            onClick={isRecording ? cancel : () => console.log("hello")}
            className={clsx(
              "p-3 rounded-full text-white cursor-pointer shadow-xl",
              isRecording ? "bg-[#EA4B48]" : "bg-purple-600 opacity-80",
            )}
          >
            {isRecording ? <Trash size={16} /> : <Plus size={16} />}
          </button>

          {isRecording ? (
            <AudioRecorderBar
              duration={duration}
              state={state}
              onResume={resume}
              onCancel={cancel}
              onPause={pause}
              analyser={analyser.current ?? undefined}
            />
          ) : (
            <div className="relative flex-1">
              <button
                type="button"
                className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center justify-center text-text-secondary hover:text-gray-600 transition-colors pr-4 z-10 cursor-pointer"
              >
                <Mic onClick={start} className="size-4" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  //   handleTyping();
                }}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="Type a message..."
                className="flex flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
                disabled={isSending}
                onKeyDown={(e) => {
                  // ✅ Empêcher l'envoi pendant la composition IME (pour les langues asiatiques)
                  if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!canSend}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">
          Press Enter to send • Be respectful and professional
        </p>
      </div>
    </div>
  );
}

export default MessageInput;
