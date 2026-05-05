import { AudioWaveform } from "./AudioWaveForm";
import { useAudioPlayer } from "../../modules/chat/hooks/useAudioPlayer";
import { MessageTime } from "./MessageTime";
import { Pause, Play } from "lucide-react";
import clsx from "clsx";
import { Customer, Message } from "@/modules/chat/types/chat.types";
import { formatDuration } from "@/modules/chat/utils/chat";
import MessageWrapper from "./MessageWrapper";
import { getCustomerAvatar } from "@/utils/chat.utils";

const VoiceMessage = ({
  isMe,
  message,
  showAvatar,
  customer,
}: {
  isMe: boolean;
  message: Message;
  showAvatar: boolean;
  customer: Customer | null;
}) => {
  const senderName = customer?.full_name || null;
  const senderAvatar = getCustomerAvatar(customer);
  const { file_url, waveform, duration } = message;
  console.log(message);

  const { playing, progress, speed, toggle, seek, cycleSpeed } = useAudioPlayer(
    file_url!,
  );

  if (!file_url || !waveform) return null;
  const validDuration = duration ? duration : 0;

  return (
    <MessageWrapper
      showAvatar={showAvatar}
      isMine={isMe}
      message={message}
      senderAvatar={senderAvatar}
      senderName={senderName}
    >
      <div
        className={clsx(
          "w-full h-full bg-linear-to-r from-purple-500 to-purple-600  text-white text-xs font-medium max-w-50 p-2 rounded-xl",
          // isMe
          //   ? "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--theme-primary)_85%,white)_-29.33%,var(--theme-primary)_100%)] text-white"
          //   : "bg-white text-text-primary border border-common-border",
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
                    ? "fill-purple-600 text-purple-600"
                    : "fill-purple-600 text-purple-600",
                )}
              />
            ) : (
              <Play
                size={18}
                className={clsx(
                  isMe
                    ? "fill-purple-600 text-purple-600"
                    : "fill-purple-600 text-purple-600",
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
              data={waveform}
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
              {formatDuration(validDuration)}
            </span>
            <button onClick={cycleSpeed} className="text-xs font-medium">
              {speed}x
            </button>
          </div>
          <MessageTime isMine={isMe} message={message} />
        </div>
      </div>
    </MessageWrapper>
  );
};

export default VoiceMessage;
