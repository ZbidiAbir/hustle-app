import { formatMessageTime } from "@/utils/chat.utils";
import { AudioWaveform } from "./AudioWaveForm";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { MessageTime } from "./MessageTime";
import { Message, VoiceMessageType } from "@/types/messages.types";
import { Pause, Play } from "lucide-react";
import clsx from "clsx";

const VoiceMessage = ({
  isMe,
  message,
  small,
}: {
  isMe: boolean;
  message: Message;
  small?: boolean;
}) => {
  const styles = small ? `max-w-[200px]` : `max-w-[260px] `;

  console.log(message);

  const {
    audioBlob = null,
    waveformData,
    duration,
  } = message.content as VoiceMessageType;
  const { playing, progress, speed, toggle, seek, cycleSpeed } =
    useAudioPlayer(audioBlob);

  if (!audioBlob || !waveformData) return null;
  const validDuration = duration ? duration : 0;

  return (
    <div
      className={clsx(
        "mx-auto w-full p-3 rounded-xl overflow-hidden",
        styles,
        isMe
          ? "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--theme-primary)_85%,white)_-29.33%,var(--theme-primary)_100%)] text-white"
          : "bg-white text-text-primary border border-common-border",
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        <button
          onClick={toggle}
          className={clsx(
            "rounded-full w-8 h-8 flex flex-col justify-center items-center",
            isMe ? "bg-white" : "bg-theme-primary",
          )}
        >
          {playing ? (
            <Pause
              size={18}
              className={clsx(
                isMe
                  ? "fill-theme-primary text-theme-primary"
                  : "fill-white text-white",
              )}
            />
          ) : (
            <Play
              size={18}
              className={clsx(
                isMe
                  ? "fill-theme-primary text-theme-primary"
                  : "fill-white text-white",
              )}
            />
          )}
        </button>

        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - rect.left) / rect.width);
          }}
        >
          <AudioWaveform
            static
            data={waveformData}
            progress={progress}
            isMe={isMe}
          />
        </div>
      </div>

      <div className="mt-1 flex justify-between">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "text-xs tabular-nums font-semibold",
              isMe ? "text-white" : "text-text-secondary",
            )}
          >
            {formatMessageTime(validDuration)}
          </span>
          <button onClick={cycleSpeed} className="text-xs font-medium">
            {speed}x
          </button>
        </div>
        <MessageTime isMe={isMe} timestamp={message.created_at} />
      </div>
    </div>
  );
};

export default VoiceMessage;
