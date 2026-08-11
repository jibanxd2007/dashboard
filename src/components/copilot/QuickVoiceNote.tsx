"use client";

import { useState } from "react";
import { Mic, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { VoiceRecorder } from "./VoiceRecorder";

interface QuickVoiceNoteProps {
  contactId?: string;
  contactName?: string;
  onSuccess?: () => void;
}

export function QuickVoiceNote({ contactId, contactName, onSuccess }: QuickVoiceNoteProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    setLoading(true);

    try {
      const prompt = contactId
        ? `Log activity for contact ID ${contactId}: ${inputText}`
        : inputText;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.ok) {
        toast.success("Voice note processed by Copilot!");
        setInputText("");
        setIsOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error("Failed to process voice note");
      }
    } catch (e) {
      toast.error("Error processing voice note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
        style={{
          background: "var(--accent-light)",
          borderColor: "var(--accent)",
          color: "var(--accent-text)",
        }}
        title="Quick AI Voice Note"
      >
        <Mic className="w-3.5 h-3.5" />
        <Sparkles className="w-3 h-3" />
        <span>Voice Note</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-3 rounded-xl border z-50 animate-fade-in shadow-xl"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {contactName ? `Voice Note for ${contactName}` : "Quick AI Voice Note"}
            </span>
            <button onClick={() => setIsOpen(false)} className="text-xs" style={{ color: "var(--text-muted)" }}>✕</button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <VoiceRecorder
              onTranscribed={(text) => setInputText((prev) => (prev ? `${prev} ${text}` : text))}
            />
            <input
              type="text"
              placeholder="Speak or type voice note..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              {loading ? "Processing..." : <><Send className="w-3 h-3" /> Execute</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
