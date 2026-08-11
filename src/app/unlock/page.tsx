"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Delete, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function UnlockPage() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        submitPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const submitPin = async (inputPin: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: inputPin }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Welcome back!");
        router.push("/");
        router.refresh();
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        toast.error("Incorrect PIN");
        setPin("");
      }
    } catch (err) {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className={`w-full max-w-xs p-8 rounded-2xl border ${shake ? "animate-shake" : ""}`}
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Solo<span style={{ color: "var(--accent-text)" }}>CRM</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Enter your 6-digit PIN</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-full transition-all duration-200"
              style={{
                background: index < pin.length ? "var(--accent)" : "var(--border-primary)",
                transform: index < pin.length ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={loading}
              className="h-12 rounded-lg text-lg font-semibold transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
            className="h-12 rounded-lg transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            disabled={loading}
            className="h-12 rounded-lg text-lg font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}
          >
            0
          </button>
          <button
            onClick={() => pin.length === 6 && submitPin(pin)}
            disabled={loading || pin.length < 6}
            className="h-12 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 border-t" style={{ borderColor: "var(--border-secondary)" }}>
          <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--accent-text)" }} />
            Private workspace
          </p>
        </div>
      </div>
    </div>
  );
}
