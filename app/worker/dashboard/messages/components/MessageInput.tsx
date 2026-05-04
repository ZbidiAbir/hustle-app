import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  Smile,
} from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  isSending: boolean;
  onTyping?: (isTyping: boolean) => void;
}

export function MessageInput({
  onSendMessage,
  isSending,
  onTyping,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleTyping = () => {
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    await onSendMessage(message);
    setMessage("");
    if (onTyping) onTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <h1>This is the message input</h1>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
          title="Upload image"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={isSending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isComposing) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={isSending || !message.trim()}
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
  );
}
