import { useEffect, useState } from "react";
import AccentBar from "../components/AccentBar";
import FeatureSheet from "../components/FeatureSheet";
import GuestPass from "../components/GuestPass";
import KillSwitch from "../components/KillSwitch";
import NightOwl from "../components/NightOwl";
import ParkWiseChatbot from "../components/ParkWiseChatbot";
import Toast from "../components/Toast";
import VNUKWordmark from "../components/VNUKWordmark";
import ZoneMemory from "../components/ZoneMemory";
import { api } from "../lib/api";
import { clearSession, getStoredUser } from "../lib/auth";
import { connectSocket, disconnectSocket } from "../lib/socket";

const FEATURES = [
  { id: "zone", label: "Zone", hint: "Remember spot" },
  { id: "guest", label: "Backup", hint: "QR pass" },
  { id: "night", label: "Night-Owl", hint: "Safe ride" },
  { id: "assist", label: "Assist", hint: "FAQ chat" },
];

export default function Home({ onLogout, onOpenTrack }) {
  const [vehicle, setVehicle] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState("");
  const [toast, setToast] = useState("");
  const [events, setEvents] = useState([]);
  const [sheet, setSheet] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await api.me();
        if (!alive) return;
        setVehicle(data.vehicle);
        setIsLocked(Boolean(data.vehicle.locked));
        const feed = await api.events();
        if (!alive) return;
        setEvents(feed || []);
      } catch (err) {
        if (!alive) return;
        setBootError(err.message || "Unable to load vehicle");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!vehicle) return undefined;

    const socket = connectSocket();

    const onGateAlert = (msg) => {
      const text = typeof msg === "string" ? msg : msg?.message || "Gate alert";
      setToast(text);
      setEvents((prev) =>
        [
          { id: `${Date.now()}`, message: text, at: new Date().toISOString(), type: "ALERT" },
          ...prev,
        ].slice(0, 12),
      );
    };

    const onLockChanged = (payload) => {
      if (payload?.vehicle) {
        setVehicle(payload.vehicle);
        setIsLocked(Boolean(payload.vehicle.locked));
      }
      if (payload?.message) setToast(payload.message);
    };

    socket.on("gate-alert", onGateAlert);
    socket.on("vehicle:lock-changed", onLockChanged);
    socket.on("gate:notification", (event) => {
      onGateAlert(event?.message || "Vehicle gate event");
    });
    socket.on("connect_error", () => {
      setToast("Realtime disconnected — REST still works");
    });

    return () => {
      socket.off("gate-alert", onGateAlert);
      socket.off("vehicle:lock-changed", onLockChanged);
      socket.off("gate:notification");
      socket.off("connect_error");
    };
  }, [vehicle?.id]);

  function handleLogout() {
    disconnectSocket();
    clearSession();
    onLogout?.();
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand-blue" />
            <p className="mt-3 text-sm text-muted">Opening ParkWise…</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (bootError || !vehicle) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold text-navy">Could not load session</p>
          <p className="max-w-xs text-sm text-muted">{bootError}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="h-12 rounded-[12px] bg-brand-red px-5 text-sm font-semibold text-white"
          >
            Back to login
          </button>
        </div>
      </Shell>
    );
  }

  const user = getStoredUser();

  return (
    <Shell>
      <Toast message={toast} onDismiss={() => setToast("")} />

      <header className="animate-fade-up mb-5 rounded-[18px] border border-border/80 bg-white/90 px-4 py-3.5 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <VNUKWordmark size="sm" />
            <p className="mt-1.5 text-xs text-muted">
              {user?.phoneMasked
                ? `${user.displayName || "SV"} · ${user.phoneMasked}`
                : user?.displayName || "VNUK Mini App"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-[10px] px-2.5 py-1.5 text-xs font-semibold text-brand-red"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="animate-fade-up-delay-1 mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
          Dashboard
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-navy">
          ParkWise
        </h1>
        <p className="mt-1 text-sm text-muted">Silent campus gate</p>
      </section>

      <section className="animate-fade-up-delay-2 mb-5 overflow-hidden rounded-[16px] border border-border/80 bg-card shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-[#005daa] via-[#0b4f8a] to-[#0b2e59] px-5 py-6 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
            Vehicle
          </p>
          <p className="mt-2 font-mono text-xl tracking-[0.18em]">{vehicle.plate}</p>
          <div className="mt-5 flex flex-col items-center gap-3">
            <KillSwitch
              compact
              isLocked={isLocked}
              onChanged={(locked, nextVehicle) => {
                setIsLocked(locked);
                if (nextVehicle) setVehicle(nextVehicle);
              }}
            />
            <p className="text-center text-xs text-white/75">
              {isLocked
                ? "Inactive — RFID ignored at the gate"
                : "Active — ready for entry and exit scans"}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Features
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {FEATURES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSheet(f.id)}
              className="rounded-[16px] border border-border/80 bg-card px-3.5 py-4 text-left shadow-[var(--shadow-card)] transition active:scale-[0.98]"
            >
              <p className="text-sm font-semibold text-navy">{f.label}</p>
              <p className="mt-1 text-[11px] text-muted">{f.hint}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="pb-24">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Gate feed
        </p>
        {events.length === 0 ? (
          <p className="rounded-[16px] border border-border/80 bg-card px-4 py-5 text-sm text-muted shadow-[var(--shadow-card)]">
            No events yet — try Kill-Switch or simulate RFID.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.slice(0, 8).map((ev) => (
              <li
                key={ev.id}
                className="rounded-[12px] bg-surface px-3 py-2.5 text-xs text-navy"
              >
                <span className="text-muted">{ev.type ? `${ev.type} · ` : ""}</span>
                {ev.message || "Event"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <FeatureSheet
        open={sheet === "zone"}
        title="Parked location"
        subtitle="Zone Memory"
        onClose={() => setSheet(null)}
      >
        <ZoneMemory
          zoneMemory={vehicle.zoneMemory}
          onSaved={(next) => {
            setVehicle(next);
            setToast("Zone saved");
          }}
        />
      </FeatureSheet>

      <FeatureSheet
        open={sheet === "guest"}
        title="Scan to enter"
        subtitle="Backup Pass"
        onClose={() => setSheet(null)}
      >
        <GuestPass />
      </FeatureSheet>

      <FeatureSheet
        open={sheet === "night"}
        title="Safe Ride Tracking"
        subtitle="Night-Owl"
        onClose={() => setSheet(null)}
      >
        <NightOwl
          onOpenTrack={(token) => {
            setSheet(null);
            onOpenTrack?.(token);
          }}
        />
      </FeatureSheet>

      <FeatureSheet
        open={sheet === "assist"}
        title="ParkWise Assist"
        subtitle="Same helper as the web app"
        onClose={() => setSheet(null)}
      >
        <ParkWiseChatbot
          variant="embedded"
          onAction={(action) => setSheet(action)}
        />
      </FeatureSheet>

      {sheet !== "assist" ? (
        <ParkWiseChatbot
          variant="floating"
          onAction={(action) => setSheet(action)}
        />
      ) : null}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="page-atmosphere min-h-screen">
      <AccentBar />
      <div className="mx-auto min-h-[calc(100vh-5px)] max-w-md px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
        {children}
      </div>
    </div>
  );
}
