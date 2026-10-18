import { useEffect, useRef, useState } from "react";
import {
  CHAT_QUICK_REPLIES,
  CHAT_WELCOME,
  matchChatFaq,
} from "../lib/chat-faq";

function botMessage(reply) {
  return {
    id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: "bot",
    text: reply.text,
    action: reply.action ?? null,
    actionLabel: reply.actionLabel ?? null,
  };
}

/**
 * Web-like Assist chat: navy / brand-blue / brand-red accents on Mini App shell.
 */
export default function ParkWiseChatbot({
  variant = "floating",
  onAction,
  className = "",
}) {
  const [open, setOpen] = useState(variant === "embedded");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [botMessage(CHAT_WELCOME)]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  function pushExchange(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    const reply = matchChatFaq(trimmed);
    setMessages((prev) => [...prev, userMsg, botMessage(reply)]);
    setInput("");
  }

  function onSubmit(e) {
    e.preventDefault();
    pushExchange(input);
  }

  const panel = (
    <div
      className={`flex flex-col overflow-hidden rounded-[16px] border border-border/80 bg-card shadow-[var(--shadow-card)] ${
        variant === "floating"
          ? "h-[min(480px,62vh)] w-[min(360px,calc(100vw-2rem))]"
          : "h-[420px] w-full"
      } ${className}`}
    >
      <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-blue to-[#0b4f8c] px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold tracking-tight">ParkWise Assist</p>
          <p className="text-[11px] text-white/75">Campus parking FAQ · demo</p>
        </div>
        {variant === "floating" ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            Close
          </button>
        ) : null}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-white to-[#eef2f8] px-3 py-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#005daa] text-white shadow-[0_6px_16px_rgba(0,93,170,0.28)]"
                  : "border border-[#e2e7f0] bg-white text-[#0b2e59] shadow-sm"
              }`}
            >
              <p>{msg.text}</p>
              {msg.role === "bot" && msg.action && onAction ? (
                <button
                  type="button"
                  onClick={() => {
                    onAction(msg.action);
                    if (variant === "floating") setOpen(false);
                  }}
                  className="mt-2 text-xs font-semibold text-[#005daa] underline-offset-2 hover:underline"
                >
                  {msg.actionLabel || "Open"}
                </button>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#e2e7f0] bg-white px-3 py-2.5">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {CHAT_QUICK_REPLIES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => pushExchange(label)}
              className="shrink-0 rounded-full border border-[#005daa]/25 bg-[#dbe5ff]/70 px-3 py-1 text-[11px] font-semibold text-[#005daa]"
            >
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Backup Pass, lock…"
            className="h-11 flex-1 rounded-[12px] border border-[#e2e7f0] bg-[#eef2f8]/80 px-3 text-sm text-[#0b2e59] outline-none placeholder:text-[#627d98] focus:border-[#005daa]/40 focus:bg-white"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[#891635] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(137,22,53,0.28)] active:scale-[0.98]"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );

  if (variant === "embedded") {
    return panel;
  }

  return (
    <div className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3">
      {open ? <div className="pointer-events-auto">{panel}</div> : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#005daa] text-white shadow-[0_12px_28px_rgba(0,93,170,0.4)] active:scale-95"
      >
        <span className="sr-only">{open ? "Close assist" : "Open assist"}</span>
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 12a8 8 0 0 1 8-8h0a8 8 0 0 1 8 8v5.5a2.5 2.5 0 0 1-2.5 2.5H12a8 8 0 0 1-8-8Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M9 11h.01M12 11h.01M15 11h.01"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
