import { useEffect, useRef, useState } from "react";

export const useAudioPlayer = (source: Blob | string | null) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!source) return;

    let url: string;
    let isObjectUrl = false;

    if (source instanceof Blob) {
      url = URL.createObjectURL(source);
      isObjectUrl = true;
    } else {
      url = source;
    }

    const audio = new Audio(url);
    audio.ontimeupdate = () => setProgress(audio.currentTime / audio.duration);
    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
    };
    audioRef.current = audio;

    return () => {
      audio.pause();
      if (isObjectUrl) URL.revokeObjectURL(url);
    };
  }, [source]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = audio.duration * value;
    setProgress(value);
  };

  const cycleSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    audio.playbackRate = next;
    setSpeed(next);
  };

  return { playing, progress, speed, toggle, seek, cycleSpeed };
};
