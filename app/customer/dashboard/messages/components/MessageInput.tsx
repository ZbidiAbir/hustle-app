import { useState } from "react";
import { Paperclip, Image as ImageIcon, Smile, Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
          disabled={disabled}
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          disabled={disabled || isSending}
        />

        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
          disabled={disabled}
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          type="submit"
          disabled={disabled || isSending || !message.trim()}
          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
