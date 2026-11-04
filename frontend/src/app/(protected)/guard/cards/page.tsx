"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StudentHit = {
  id: string;
  studentId: string;
  name: string;
  email: string;
  rfidCards: Array<{
    id: string;
    displaySuffix: string;
    status: string;
  }>;
};

type UnknownUid = {
  credentialRaw: string;
  eventId: string;
  occurredAt: string;
  reason: string;
};

type ListedCard = {
  id: string;
  displaySuffix: string;
  status: string;
  studentId: string;
  studentName: string;
};

export default function GuardCardsPage() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<StudentHit[]>([]);
  const [selected, setSelected] = useState<StudentHit | null>(null);
  const [rawToken, setRawToken] = useState("");
  const [replace, setReplace] = useState(true);
  const [unknown, setUnknown] = useState<UnknownUid[]>([]);
  const [cards, setCards] = useState<ListedCard[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanHint, setScanHint] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshSide = useCallback(async () => {
    const [u, c] = await Promise.all([
      api.v1.guardUnknownRfid(),
      api.v1.guardListRfid(),
    ]);
    setUnknown(u);
    setCards(c);
  }, []);

  useEffect(() => {
    refreshSide().catch((e) => setError(e.message || "Load failed"));
    const t = setInterval(() => {
      refreshSide().catch(() => undefined);
    }, 4000);
    return () => clearInterval(t);
  }, [refreshSide]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      api.v1.guardCancelAwaitScan().catch(() => undefined);
    };
  }, []);

  async function search(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    try {
      const hits = await api.v1.guardSearchStudents(query.trim() || "2204");
      setStudents(hits);
      if (hits.length === 1) setSelected(hits[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }

  function pickStudent(s: StudentHit) {
    setSelected(s);
  }

  function stopScanPoll() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setScanning(false);
  }

  async function startEsp32Scan() {
    if (!selected) {
      setError("Chọn sinh viên trước, rồi bấm Quét thẻ");
      return;
    }
    setError("");
    setMessage("");
    setScanning(true);
    setScanHint("Đang chờ quét trên ESP32 (60s)… đặt thẻ lên đầu đọc");

    try {
      await api.v1.guardStartAwaitScan({
        studentId: selected.studentId,
        replace,
      });
    } catch (err) {
      stopScanPoll();
      setError(err instanceof Error ? err.message : "Không bắt đầu được chế độ quét");
      return;
    }

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const st = await api.v1.guardAwaitScanStatus();
        if (st.status === "waiting") {
          const sec = Math.ceil((st.remainingMs || 0) / 1000);
          setScanHint(`Đang chờ ESP32… còn ${sec}s — quét thẻ ngay`);
          return;
        }
        stopScanPoll();
        if (st.status === "registered" && st.card) {
          setRawToken(st.credentialRaw || "");
          setMessage(
            `Đã gắn tự động …${st.card.displaySuffix} → ${st.card.studentId}. Quét lại để check-in.`,
          );
          setScanHint("");
          await search();
          await refreshSide();
          return;
        }
        if (st.status === "error") {
          setError(st.error || "Đăng ký thẻ thất bại");
          setScanHint("");
          return;
        }
        if (st.status === "expired") {
          setError(st.error || "Hết giờ — bấm Quét thẻ lại");
          setScanHint("");
          return;
        }
        setScanHint("");
      } catch {
        // keep polling
      }
    }, 800);
  }

  async function cancelScan() {
    stopScanPoll();
    setScanHint("");
    await api.v1.guardCancelAwaitScan().catch(() => undefined);
  }

  async function register(e: FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Chọn sinh viên trước");
      return;
    }
    if (!rawToken.trim()) {
      setError("Bấm Quét thẻ hoặc nhập UID thủ công");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await api.v1.guardRegisterRfid({
        rawToken: rawToken.trim().toUpperCase(),
        studentId: selected.studentId,
        replace,
      });
      setMessage(
        `Đã gắn thẻ …${String(data.displaySuffix)} → ${String(data.studentId)}`,
      );
      setRawToken("");
      await search();
      await refreshSide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
          Guard · RFID
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Đăng ký thẻ RFID</h1>
        <p className="mt-1 text-sm text-muted">
          Chọn sinh viên → <strong>Quét thẻ</strong> → đặt thẻ lên ESP32 → hệ thống
          tự gắn. Lần quét sau mới check-in / mở cổng.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-4">
          <p className="text-sm font-semibold text-navy">Thẻ chưa đăng ký (ESP32)</p>
          <ul className="max-h-48 space-y-2 overflow-auto">
            {unknown.map((u) => (
              <li key={u.eventId}>
                <button
                  type="button"
                  className="w-full rounded-lg bg-surface px-3 py-2 text-left text-xs hover:ring-2 hover:ring-brand-blue/40"
                  onClick={() => setRawToken(u.credentialRaw)}
                >
                  <span className="font-mono font-semibold text-navy">
                    {u.credentialRaw}
                  </span>
                  <span className="mt-0.5 block text-muted">
                    {new Date(u.occurredAt).toLocaleString()} — bấm để điền UID
                  </span>
                </button>
              </li>
            ))}
            {unknown.length === 0 ? (
              <li className="text-xs text-muted">
                Không có thẻ lạ gần đây (hoặc đã gắn bằng Quét thẻ).
              </li>
            ) : null}
          </ul>
        </Card>

        <Card className="space-y-3 p-4">
          <p className="text-sm font-semibold text-navy">Thẻ đã gắn (gần đây)</p>
          <ul className="max-h-48 space-y-1.5 overflow-auto text-xs">
            {cards.slice(0, 15).map((c) => (
              <li
                key={c.id}
                className="flex justify-between gap-2 rounded-lg bg-surface px-3 py-2"
              >
                <span>
                  …{c.displaySuffix} · {c.studentId} · {c.studentName}
                </span>
                <span className="text-muted">{c.status}</span>
              </li>
            ))}
            {cards.length === 0 ? (
              <li className="text-muted">Chưa có thẻ trong hệ thống.</li>
            ) : null}
          </ul>
        </Card>
      </div>

      <Card className="space-y-4 p-5">
        <form className="flex gap-2" onSubmit={search}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="MSSV / tên / email — ví dụ 22040002"
          />
          <Button type="submit" variant="secondary">
            Tìm
          </Button>
        </form>

        {students.length > 0 ? (
          <ul className="max-h-40 space-y-1 overflow-auto">
            {students.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => pickStudent(s)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selected?.id === s.id
                      ? "bg-brand-blue text-white"
                      : "bg-surface text-navy hover:bg-brand-blue/10"
                  }`}
                >
                  <span className="font-semibold">{s.studentId}</span> — {s.name}
                  <span
                    className={`ml-2 text-xs ${selected?.id === s.id ? "text-white/80" : "text-muted"}`}
                  >
                    {s.rfidCards.length
                      ? `thẻ …${s.rfidCards.map((c) => c.displaySuffix).join(",")}`
                      : "chưa có thẻ"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            type="checkbox"
            checked={replace}
            onChange={(e) => setReplace(e.target.checked)}
          />
          Ghi đè nếu UID đã tồn tại / thay thẻ cũ
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={!selected || scanning}
            onClick={startEsp32Scan}
            className="min-w-[160px]"
          >
            {scanning ? "Đang chờ quét…" : "Quét thẻ (ESP32)"}
          </Button>
          {scanning ? (
            <Button type="button" variant="secondary" onClick={cancelScan}>
              Huỷ
            </Button>
          ) : null}
        </div>
        {scanHint ? (
          <p className="animate-pulse text-sm font-medium text-brand-blue">{scanHint}</p>
        ) : null}

        <form className="space-y-3 border-t border-border pt-4" onSubmit={register}>
          <p className="text-xs text-muted">Hoặc nhập UID thủ công rồi Đăng ký</p>
          <label className="block text-xs font-medium text-muted">
            UID thẻ
            <Input
              className="mt-1 font-mono"
              value={rawToken}
              onChange={(e) => setRawToken(e.target.value.toUpperCase())}
              placeholder="AABBCCDD"
            />
          </label>
          {error ? <p className="text-sm text-brand-red">{error}</p> : null}
          {message ? <p className="text-sm text-brand-blue">{message}</p> : null}
          <Button type="submit" variant="secondary" disabled={loading || !selected} className="w-full">
            {loading ? "Đang lưu…" : "Đăng ký thủ công"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
