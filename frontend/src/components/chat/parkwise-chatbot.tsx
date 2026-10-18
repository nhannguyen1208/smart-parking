"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import {
  CHAT_QUICK_REPLIES,
  CHAT_WELCOME,
  matchChatFaq,
  type ChatReply,
} from "@/lib/chat-faq";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  href?: string;
  linkLabel?: string;
};

type ParkWiseChatbotProps = {
  /** floating FAB + panel (default) or inline panel for Help page */
  variant?: "floating" | "embedded";
  className?: string;
};

function botMessage(reply: ChatReply): ChatMessage {
  return {
    id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: "bot",
    text: reply.text,
    href: reply.href,
    linkLabel: reply.linkLabel,
  };
}

export function ParkWiseChatbot({
  variant = "floating",
  className = "",
}: ParkWiseChatbotProps) {
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(variant === "embedded");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    botMessage(CHAT_WELCOME),
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hideFloatingOnHelp = variant === "floating" && pathname === "/help";

  useEffect(() => {
    if (hideFloatingOnHelp) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open, hideFloatingOnHelp]);

  function pushExchange(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    const reply = matchChatFaq(trimmed);
    setMessages((prev) => [...prev, userMsg, botMessage(reply)]);
    setInput("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    pushExchange(input);
  }

  if (hideFloatingOnHelp) {
    return null;
  }

  const panel = (
    <div
      id={panelId}
      className={`flex flex-col overflow-hidden rounded-[16px] border border-border/80 bg-card shadow-[var(--shadow-card)] ${
        variant === "floating"
          ? "h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))]"
          : "h-[480px] w-full"
      } ${className}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/70 bg-gradient-to-r from-brand-blue to-[#0b4f8c] px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold tracking-tight">ParkWise Assist</p>
          <p className="text-[11px] text-white/75">Campus parking FAQ · demo</p>
        </div>
        {variant === "floating" ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
            aria-label="Close chat"
          >
            Close
          </button>
        ) : null}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-white to-surface/40 px-3 py-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-blue text-white shadow-[0_6px_16px_rgba(0,93,170,0.25)]"
                  : "border border-border/70 bg-white text-navy shadow-sm"
              }`}
            >
              <p>{msg.text}</p>
              {msg.role === "bot" && msg.href ? (
                <Link
                  href={msg.href}
                  className="mt-2 inline-flex text-xs font-semibold text-brand-blue underline-offset-2 hover:underline"
                >
                  {msg.linkLabel ?? "Open"}
                </Link>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border/70 bg-white px-3 py-2.5">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {CHAT_QUICK_REPLIES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => pushExchange(label)}
              className="shrink-0 rounded-full border border-brand-blue/20 bg-brand-light/50 px-3 py-1 text-[11px] font-semibold text-brand-blue transition hover:bg-brand-light"
            >
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about plans, QR, SOS…"
            className="h-11 flex-1 rounded-[12px] border border-border bg-surface/40 px-3 text-sm text-navy outline-none placeholder:text-muted focus:border-brand-blue/40 focus:bg-white"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-[12px] bg-brand-red px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(137,22,53,0.25)] transition hover:bg-[#70102b] active:scale-[0.98]"
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
    <div className="pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-3 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open ? <div className="pointer-events-auto animate-fade-up">{panel}</div> : null}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-[0_12px_28px_rgba(0,93,170,0.35)] transition hover:bg-[#004a88] active:scale-95"
      >
        <span className="sr-only">{open ? "Close ParkWise Assist" : "Open ParkWise Assist"}</span>
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
