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
