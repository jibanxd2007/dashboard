"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  Check,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { VoiceRecorder } from "./VoiceRecorder";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    args: any;
    state: "call" | "result";
    result?: any;
  }>;
}

const SAMPLE_PROMPTS = [
  "What's due today?",
  "Add a new lead from Instagram",
  "Which leads have gone quiet?",
  "Generate a 3D render of a futuristic office workspace",
];

export function CopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [confirmingToolId, setConfirmingToolId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut ⌘J / Ctrl+J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = userPrompt || input;
    if (!textToSend.trim()) return;

    setApiKeyMissing(false);
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userPrompt) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.error === "GOOGLE_KEY_MISSING" || errData.error === "GROQ_KEY_MISSING") {
          setApiKeyMissing(true);
        } else {
          toast.error(errData.message || "Failed to get AI response");
        }
        setLoading(false);
        return;
      }

      // Stream text reader
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantMsgId = `a_${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "" },
      ]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        // Clean Vercel AI SDK data stream prefixes e.g. 0:"..."
        const cleanContent = assistantText
          .replace(/0:"/g, "")
          .replace(/"/g, "")
          .replace(/\\n/g, "\n");

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: cleanContent } : m
          )
        );
      }
    } catch (e: any) {
      toast.error("Error communicating with Copilot");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmProposal = async (toolCallId: string, proposalType: string, params: any) => {
    setConfirmingToolId(toolCallId);
    try {
      const res = await fetch("/api/ai/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalType, params }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Action confirmed!");
        // Update proposal message to done state
        setMessages((prev) =>
          prev.map((m) => {
            if (m.content.includes(proposalType)) {
              return {
                ...m,
                content: `${m.content}\n\n✅ **Confirmed & Executed**: ${data.message}`,
              };
            }
            return m;
          })
        );
      } else {
        toast.error(data.message || "Confirmation failed");
      }
    } catch (e) {
      toast.error("Error confirming action");
    } finally {
      setConfirmingToolId(null);
    }
  };

  const handleUndoAction = async (actionId: string) => {
    try {
      const res = await fetch("/api/ai/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Action undone successfully!");
        setMessages((prev) => [
          ...prev,
          {
            id: `sys_${Date.now()}`,
            role: "system",
            content: `↩️ **Action Undone**: ${data.message}`,
          },
        ]);
      } else {
        toast.error(data.error || "Failed to undo action");
      }
    } catch (e) {
      toast.error("Error undoing action");
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 md:bottom-6 md:right-6 p-3.5 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center border"
        style={{
          // Below dialogs so it cannot float over an open modal.
          zIndex: "var(--z-sidebar)" as any,
          background: "var(--accent)",
          color: "var(--text-inverse)",
          borderColor: "var(--accent-hover)",
        }}
        title="Open AI Copilot (⌘J)"
      >
        <Sparkles className="w-5 h-5 fill-current" />
      </button>

      {/* Drawer / Sheet Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 flex justify-end"
          style={{ zIndex: "var(--z-copilot)" as any, background: "var(--bg-modal-overlay)" }}
        >
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={() => setIsOpen(false)} />

          {/* Drawer Container (420px desktop, full-screen mobile) */}
          <div
            className="w-full sm:w-[420px] h-full flex flex-col justify-between border-l shadow-2xl animate-fade-in"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-primary)",
            }}
          >
            {/* Header */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    AI Copilot
                  </h2>
                  <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                    Press ⌘J to toggle
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/ask"
                  onClick={() => setIsOpen(false)}
                  className="text-xs px-2.5 py-1 rounded-md border font-medium transition-colors"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                >
                  Full View
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* API Key Missing Banner */}
            {apiKeyMissing && (
              <div
                className="m-3 p-3 rounded-xl border text-xs flex items-center justify-between"
                style={{ background: "var(--amber-light)", borderColor: "var(--amber)", color: "var(--text-primary)" }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "var(--amber)" }} />
                  <span>Add your AI key in Settings to turn this on.</span>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold shrink-0"
                  style={{ background: "var(--amber)", color: "var(--text-inverse)" }}
                >
                  Settings
                </Link>
              </div>
            )}

            {/* Chat Body Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {messages.length === 0 ? (
                <div className="space-y-4 py-6">
                  <div className="text-center space-y-1">
                    <Sparkles className="w-8 h-8 mx-auto" style={{ color: "var(--accent-text)" }} />
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      How can I help you today?
                    </h3>
                    <p style={{ color: "var(--text-muted)" }}>
                      Speak or type an instruction to create leads, schedule meetings, or query pipeline.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Sample Instructions
                    </p>
                    {SAMPLE_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full text-left p-2.5 rounded-lg border transition-colors hover:border-teal-500 text-xs font-medium"
                        style={{
                          background: "var(--bg-secondary)",
                          borderColor: "var(--border-secondary)",
                          color: "var(--text-primary)",
                        }}
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] p-3 rounded-xl border text-xs whitespace-pre-wrap ${
                        msg.role === "user" ? "font-medium" : ""
                      }`}
                      style={{
                        background:
                          msg.role === "user"
                            ? "var(--accent-light)"
                            : "var(--bg-secondary)",
                        borderColor:
                          msg.role === "user"
                            ? "var(--accent)"
                            : "var(--border-secondary)",
                        color:
                          msg.role === "user"
                            ? "var(--accent-text)"
                            : "var(--text-primary)",
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Proposal Action Card rendering for Delete / Bulk >5 */}
                    {msg.content.includes("isProposal") || msg.content.includes("proposalType") ? (
                      <ProposalCard
                        content={msg.content}
                        loading={Boolean(confirmingToolId)}
                        onConfirm={(type, params) =>
                          handleConfirmProposal(msg.id, type, params)
                        }
                      />
                    ) : null}

                    {/* 60-Second Undo Card for direct actions */}
                    {msg.role === "assistant" && (
                      <ActionCardWithUndo content={msg.content} onUndo={handleUndoAction} />
                    )}

                    {/* AI Image Generation Card */}
                    {msg.role === "assistant" && (
                      <ImageResultCard content={msg.content} />
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Copilot is executing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div
              className="p-3 border-t space-y-2"
              style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <VoiceRecorder
                  onTranscribed={(text) =>
                    setInput((prev) => (prev ? `${prev} ${text}` : text))
                  }
                  disabled={loading}
                />
                <input
                  type="text"
                  placeholder="Ask copilot or speak..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none border"
                  style={{
                    background: "var(--bg-input)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-lg transition-colors disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProposalCard({
  content,
  onConfirm,
  loading,
}: {
  content: string;
  onConfirm: (type: string, params: any) => void;
  loading: boolean;
}) {
  let proposal: any = null;
  try {
    const jsonMatch = content.match(/\{[\s\S]*"isProposal"[\s\S]*\}/);
    if (jsonMatch) {
      proposal = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {}

  if (!proposal) return null;

  return (
    <div
      className="w-full mt-2 p-3 rounded-xl border-l-4 border shadow-sm space-y-2 text-xs"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-primary)",
        borderLeftColor: "var(--amber)",
      }}
    >
      <div className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--amber)" }}>
        <AlertTriangle className="w-4 h-4" />
        <span>Confirmation Required</span>
      </div>
      <p style={{ color: "var(--text-primary)" }}>{proposal.summary}</p>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onConfirm(proposal.proposalType, proposal.params)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
        >
          <Check className="w-3.5 h-3.5" /> Confirm & Run
        </button>
      </div>
    </div>
  );
}

function ActionCardWithUndo({
  content,
  onUndo,
}: {
  content: string;
  onUndo: (actionId: string) => void;
}) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [undone, setUndone] = useState(false);

  const match = content.match(/undoToken["':\s]+["'](act_[a-z0-9]+)["']/i) || content.match(/(act_[a-z0-9]{6,12})/i);
  const actionId = match ? match[1] : null;

  useEffect(() => {
    if (!actionId || undone || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [actionId, undone, timeLeft]);

  if (!actionId || timeLeft <= 0) return null;

  return (
    <div
      className="w-full mt-2 p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 animate-fade-in"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)" }}
    >
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Executed · Undo ({timeLeft}s)
      </span>
      <button
        onClick={() => {
          setUndone(true);
          onUndo(actionId);
        }}
        disabled={undone}
        className="px-2.5 py-1 rounded text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
      >
        {undone ? "Undone" : "↩️ Undo"}
      </button>
    </div>
  );
}

function ImageResultCard({ content }: { content: string }) {
  const match = content.match(/https:\/\/image\.pollinations\.ai\/prompt\/[^\s"')]+/);
  if (!match) return null;

  const imageUrl = match[0];

  return (
    <div
      className="w-full mt-2 p-3 rounded-xl border space-y-2 text-xs animate-fade-in"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-teal-500 flex items-center gap-1">
          ✨ Generated AI Image
        </span>
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          download="sahoda-ai-image.png"
          className="px-2 py-1 rounded text-[11px] font-medium bg-teal-600 hover:bg-teal-700 text-white transition flex items-center gap-1"
        >
          Download PNG
        </a>
      </div>

      <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: "var(--border-secondary)" }}>
        <img
          src={imageUrl}
          alt="Generated AI image"
          className="w-full h-auto max-h-64 object-cover"
          loading="lazy"
        />
      </div>
    </div>
  );
}
