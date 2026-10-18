"use client";

import { FormEvent, useEffect, useState } from "react";
import { ParkWiseChatbot } from "@/components/chat/parkwise-chatbot";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api-client";

export default function HelpPage() {
  const { user } = useAuth();
  const [type, setType] = useState("FLAT_TIRE");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [list, setList] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (!user) return;
    api.v1.listSos().then((d) => setList(d as Array<Record<string, unknown>>));
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const data = await api.v1.createSos({ type, description });
      setMessage(data.note);
      const rows = (await api.v1.listSos()) as Array<Record<string, unknown>>;
      setList(rows);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            Support
          </p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-navy md:text-[34px]">
            Help & Campus SOS
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Ask ParkWise Assist about plans and passes, or submit an SOS for campus
            assistance. Demo SOS stays OPEN until a guard accepts.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 animate-fade-up-delay-1">
            <h2 className="text-base font-semibold text-navy">ParkWise Assist</h2>
            <ParkWiseChatbot variant="embedded" />
          </div>

          <div className="space-y-4 animate-fade-up-delay-2">
            <h2 className="text-base font-semibold text-navy">Campus SOS</h2>
            {user ? (
              <Card className="p-5">
                <form className="space-y-3" onSubmit={onSubmit}>
                  <label className="block text-xs text-muted">
                    Issue type
                    <select
                      className="mt-1 h-11 w-full rounded-xl border border-border px-3 text-sm text-navy"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="FLAT_TIRE">Flat tire</option>
                      <option value="BATTERY">Battery issue</option>
                      <option value="ASSISTANCE">Campus assistance</option>
                    </select>
                  </label>
                  <label className="block text-xs text-muted">
                    Description
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>
                  <Button type="submit" className="w-full">
                    Submit SOS request
                  </Button>
                </form>
              </Card>
            ) : (
              <p className="text-sm text-muted">Sign in as a student to submit SOS.</p>
            )}
            {message ? (
              <p className="rounded-[12px] bg-surface px-3 py-2 text-sm text-muted">
                {message}
              </p>
            ) : null}
            <div className="space-y-2">
              {list.map((s) => (
                <Card key={String(s._id || s.id)} className="p-3 text-sm">
                  <p className="font-semibold text-navy">
                    {String(s.type)} · {String(s.status)}
                  </p>
                  <p className="text-xs text-muted">{String(s.description || "")}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
