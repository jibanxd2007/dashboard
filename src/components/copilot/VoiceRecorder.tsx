"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscribed, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startRecording = async () => {
    setErrorMsg(null);

    // If browser STT is explicitly configured
    if (process.env.NEXT_PUBLIC_STT_PROVIDER === "browser" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      startBrowserSpeechRecognition();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Setup Web Audio API AnalyserNode for live amplitude visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      // Select supported MIME type
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else {
          mimeType = "";
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        await uploadAndTranscribe(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setRecording(true);

      // Start drawing canvas wave visualizer
      drawAmplitudeWave();
    } catch (err: any) {
      console.error("Mic access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Microphone permission denied. Enable mic access in your browser site settings.");
        toast.error("Mic access denied");
      } else {
        setErrorMsg("Could not access microphone.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const startBrowserSpeechRecognition = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;

      recognition.onstart = () => setRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscribed(transcript);
        setRecording(false);
      };
      recognition.onerror = (err: any) => {
        console.error("Browser STT error:", err);
        setRecording(false);
        toast.error("Speech recognition failed");
      };
      recognition.onend = () => setRecording(false);

      recognition.start();
    } catch (e) {
      toast.error("Browser speech recognition unavailable");
    }
  };

  const drawAmplitudeWave = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = "var(--accent)";
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const uploadAndTranscribe = async (audioBlob: Blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "speech.webm");

      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.text) {
        onTranscribed(data.text);
        toast.success("Voice transcribed into input box!");
      } else {
        toast.error(data.message || data.error || "Transcription failed");
      }
    } catch (e) {
      toast.error("Error sending voice recording");
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      {recording ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border animate-pulse" style={{ background: "var(--red-light)", borderColor: "var(--red)" }}>
          <canvas ref={canvasRef} width={60} height={20} className="rounded shrink-0" />
          <button
            onClick={stopRecording}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: "var(--red)" }}
          >
            <Square className="w-3.5 h-3.5 fill-current" /> Stop
          </button>
        </div>
      ) : (
        <button
          type="button"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          onClick={() => {
            if (!recording) startRecording();
            else stopRecording();
          }}
          disabled={disabled || transcribing}
          className="p-2 rounded-lg border transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
            color: "var(--accent-text)",
          }}
          title="Press & hold or click to speak (Transcribes into input text box)"
        >
          <Mic className={`w-4 h-4 ${transcribing ? "animate-spin" : ""}`} />
        </button>
      )}

      {errorMsg && (
        <div className="absolute bottom-full mb-2 left-0 w-64 p-2 rounded-lg text-[11px] border" style={{ background: "var(--red-light)", color: "var(--red)", borderColor: "var(--red)" }}>
          <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
