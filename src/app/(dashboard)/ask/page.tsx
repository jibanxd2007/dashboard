"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  MessageSquare,
  Plus,
  Clock,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { VoiceRecorder } from "@/components/copilot/VoiceRecorder";
import { AIThread } from "@/lib/mockStore";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

const SAMPLE_PROMPTS = [
  "Add Rohan from Sohlene, +91 98765 43210, came from Instagram",
  "What's due today?",
  "Move all leads older than 2 weeks with no reply to lost",
  "Schedule a call with Priya Friday 4pm and remind me 30 minutes before",
];

export default function FullAskPage() {
  const [threads, setThreads] = useState<AIThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/ai/threads");
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (e) {
      console.error("Error fetching threads:", e);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleCreateNewThread = async () => {
    try {
      const res = await fetch("/api/ai/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      const data = await res.json();
      setThreads((prev) => [data, ...prev]);
      setActiveThreadId(data.id);
      setMessages([]);
    } catch (e) {
      toast.error("Failed to create new thread");
    }
  };

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = userPrompt || input;
    if (!textToSend.trim()) return;

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
          threadId: activeThreadId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to get response");
        setLoading(false);
        return;
      }

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
    } catch (e) {
      toast.error("Error communicating with AI");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (proposalType: string, params: any) => {
    setConfirmingId(proposalType);
    try {
      const res = await fetch("/api/ai/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalType, params }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Action confirmed!");
      } else {
        toast.error(data.message || "Confirmation failed");
      }
    } catch (e) {
      toast.error("Error executing action");
    } finally {
      setConfirmingId(null);
    }
  };

  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 animate-fade-in">
      {/* Sidebar: Thread List */}
      <div className="w-full md:w-64 card p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
              <Clock className="w-3.5 h-3.5" style={{ color: "var(--accent-text)" }} /> Conversations
            </h3>
            <button
              onClick={handleCreateNewThread}
              className="p-1 rounded-lg hover:opacity-80 transition-colors"
              style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {threads.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>No previous chats.</p>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium truncate transition-colors"
                  style={{
                    background: activeThreadId === t.id ? "var(--accent-light)" : "transparent",
                    color: activeThreadId === t.id ? "var(--accent-text)" : "var(--text-secondary)",
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
                  {t.title}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Pane */}
      <div className="flex-1 card flex flex-col justify-between overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {messages.length === 0 ? (
            <div className="max-w-xl mx-auto py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Full Copilot Assistant</h2>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Execute complex agency operations via voice or text.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-4">
                {SAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 rounded-xl border text-xs transition-colors hover:border-teal-500"
                    style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)", color: "var(--text-primary)" }}
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
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className="max-w-[85%] p-3.5 rounded-xl border text-xs sm:text-sm whitespace-pre-wrap"
                  style={{
                    background: msg.role === "user" ? "var(--accent-light)" : "var(--bg-secondary)",
                    borderColor: msg.role === "user" ? "var(--accent)" : "var(--border-secondary)",
                    color: msg.role === "user" ? "var(--accent-text)" : "var(--text-primary)",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <RefreshCw className="w-4 h-4 animate-spin" /> Copilot is processing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t" style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <VoiceRecorder
              onTranscribed={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Speak or type instruction..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-lg px-3.5 py-2 text-xs sm:text-sm focus:outline-none"
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
