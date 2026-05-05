"use client";

import { useEffect, useRef, useState } from "react";

export const AudioWaveform = ({
  static: isStatic = false,
  data = [],
  progress = 0,
  analyser,
  state,
  isMe,
}: {
  static?: boolean;
  data?: number[];
  progress?: number;
  analyser?: AnalyserNode | null;
  state?: RecordingState;
  isMe?: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const displayProgressRef = useRef(0); // smoothed progress
  const targetProgressRef = useRef(0); // actual progress
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    if (isStatic) {
      if (data.length === 0) return;

      targetProgressRef.current = progress;

      // cancel any previous animation loop
      cancelAnimationFrame(animFrameRef.current!);

      const draw = () => {
        // ease displayProgress toward targetProgress
        const diff = targetProgressRef.current - displayProgressRef.current;
        if (Math.abs(diff) > 0.001) {
          displayProgressRef.current += diff * 0.12; // tweak 0.12 for faster/slower
        } else {
          displayProgressRef.current = targetProgressRef.current;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const filledUpTo = displayProgressRef.current * data.length;

        data.forEach((value, i) => {
          const barHeight = Math.max(2, value * canvas.height);
          const y = (canvas.height - barHeight) / 2;

          // smooth per-bar fill using fractional filledUpTo
          const fill = Math.min(1, Math.max(0, filledUpTo - i));
          const alpha = 0.35 + fill * 0.65; // lerp between 0.35 and 1
          ctx.fillStyle = isMe
            ? `rgba(255,255,255,${alpha})`
            : `rgba(142, 155, 167, ${alpha})`;

          ctx.beginPath();
          ctx.roundRect(i * 4, y, 2, barHeight, 2);
          ctx.fill();
        });

        animFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
      return () => cancelAnimationFrame(animFrameRef.current!);
    }

    if (!analyser) return;

    if (state === "paused" || state === "inactive") {
      cancelAnimationFrame(animFrameRef.current!);
      return;
    }
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(frequencyData);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      frequencyData.forEach((value, i) => {
        const barHeight = (value / 255) * canvas.height;
        const y = (canvas.height - barHeight) / 2;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(i * 4, y, 2, barHeight, 2);
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current!);
  }, [isStatic, analyser, data, progress, state, canvasWidth]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      const width = container.offsetWidth;
      canvas.width = width;
      setCanvasWidth(width); // ← triggers drawing effect to re-run
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);
  return (
    <div ref={containerRef} className="flex-1 w-full">
      <canvas ref={canvasRef} height={32} className="w-full h-full block" />
    </div>
  );
};
