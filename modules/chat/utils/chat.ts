export function formatDuration(value: number | string): string {
  if (value == null) return "00:00";

  const seconds = typeof value === "number" ? value : parseInt(value, 10);

  if (isNaN(seconds)) return "00:00";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return hrs > 0
    ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;
}

export async function extractWaveform(
  blob: Blob,
  barCount = 40,
): Promise<number[]> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new OfflineAudioContext(1, 1, 44100);
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  const raw = decoded.getChannelData(0);
  const blockSize = Math.floor(raw.length / barCount);

  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const block = raw.slice(i * blockSize, (i + 1) * blockSize);
    const rms = Math.sqrt(
      block.reduce((sum, v) => sum + v * v, 0) / block.length,
    );
    bars.push(rms);
  }

  const max = Math.max(...bars);
  return bars.map((v) => v / max);
}

export const formatMessageTime = (
  dateString: Date | string | number | undefined,
) => {
  if (!dateString) return "undefined";
  const normalizedDate =
    dateString instanceof Date ? dateString : new Date(dateString);

  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - normalizedDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return normalizedDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return normalizedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

export const formatConversationTime = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};
