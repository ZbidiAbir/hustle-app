import { Pause, PlayIcon } from "lucide-react";
import { AudioWaveform } from "../../../messages/components/AudioWaveForm";
import { formatDuration } from "../utils/chat.utils";

export const AudioRecorderBar = ({
  duration,
  analyser,
  onPause,
  onResume,
  state,
  isMe,
}: {
  duration: number | string;
  onCancel: () => void;
  onPause: () => void;
  onResume?: () => void;
  analyser: AnalyserNode | null | undefined;
  state: RecordingState;
  isMe?: boolean;
}) => {
  return (
    <div className="relative flex-1 flex justify-center items-center h-15">
      {/* background image */}
      <img
        src="/audio/vector.svg"
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />

      {/* content bar */}
      <div className="relative flex items-center gap-2 bg-theme-error rounded-[40px]! px-4 py-2 z-10 h-10 w-[97%] min-w-0 bg-[#EA4B48]">
        {state === "recording" ? (
          <Pause
            onClick={onPause}
            className="size-5 text-white cursor-pointer"
          />
        ) : state === "paused" ? (
          <PlayIcon
            onClick={onResume}
            className="size-5 text-white cursor-pointer"
          />
        ) : null}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-theme-error-600" />
          <span className="text-sm tabular-nums text-white">
            {formatDuration(duration)}
          </span>
        </div>
        <AudioWaveform analyser={analyser} state={state} isMe={isMe} />
      </div>
    </div>
  );
};
