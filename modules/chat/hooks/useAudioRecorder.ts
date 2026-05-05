import { useRef, useState } from "react";

export const useAudioRecorder = () => {
  const [state, setState] = useState<RecordingState>("inactive");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      setState("inactive");
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setState("recording");
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const pause = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current!);
      setState("paused");
      console.log(mediaRecorderRef);
    }
  };

  const resume = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      setState("recording");
    }
  };

  const stop = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return;

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setState("inactive");
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      clearInterval(timerRef.current!);
      audioCtxRef.current?.close();
    });
  };
  const cancel = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    clearInterval(timerRef.current!);
    audioCtxRef.current?.close();
    analyserRef.current = null;
    setAudioBlob(null);
    setDuration(0);
    setState("inactive");
  };

  const lock = () => setState("inactive");

  return {
    state,
    duration,
    audioBlob,
    analyser: analyserRef,
    start,
    pause,
    resume,
    stop,
    cancel,
    lock,
  };
};
