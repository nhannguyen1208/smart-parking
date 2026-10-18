import { useEffect, useState } from "react";
import GuestPass from "../components/GuestPass";
import KillSwitch from "../components/KillSwitch";
import NightOwl from "../components/NightOwl";
import ZoneMemory from "../components/ZoneMemory";
import { api } from "../lib/api";
import { connectSocket, getSocket } from "../lib/socket";

const VEHICLE_ID = "veh_001";
const GREEN_POINTS = 150;

export default function Dashboard() {
  const [vehicle, setVehicle] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState("");
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await api.me(VEHICLE_ID);
        if (!alive) return;
        setVehicle(data.vehicle);
        setIsLocked(Boolean(data.vehicle.locked));
      } catch (err) {
        if (!alive) return;
        setBootError(err.message || "Unable to load vehicle");
        // Still render premium shell with demo defaults
        setVehicle({
          id: VEHICLE_ID,
          ownerName: "Student",
          plate: "59X1-12345",
          zaloUserId: "zalo_demo_001",
          locked: false,
          zoneMemory: { zone: "Zone A", row: "Row 3", note: "Near library" },
        });
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

    const socket = connectSocket({
      zaloUserId: vehicle.zaloUserId,
      vehicleId: vehicle.id,
    });

    const onGateAlert = (msg) => {
      const text = typeof msg === "string" ? msg : msg?.message || "Gate alert";
      setAlerts((prev) => [text, ...prev].slice(0, 4));
      // Spec: listen and surface gate alerts
      window.alert(text);
    };

    const onLockChanged = (payload) => {
      if (payload?.vehicle) {
        setVehicle(payload.vehicle);
        setIsLocked(Boolean(payload.vehicle.locked));
      }
    };

    socket.on("gate-alert", onGateAlert);
    socket.on("vehicle:lock-changed", onLockChanged);
    socket.on("gate:notification", (event) => {
      onGateAlert(event?.message || "Vehicle gate event");
    });

    return () => {
      socket.off("gate-alert", onGateAlert);
      socket.off("vehicle:lock-changed", onLockChanged);
      socket.off("gate:notification");
    };
  }, [vehicle?.id, vehicle?.zaloUserId]);

  // Ensure socket is available even before vehicle loads (KillSwitch emit)
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
  }, []);

  if (loading) {
    return (
      <Shell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-sky-400" />
            <p className="mt-3 text-sm text-white/50">Opening ParkWise…</p>
          </div>
        </div>
      </Shell>
    );
  }

  const displayName = vehicle?.ownerName?.split(" ")[0] || "Student";

  return (
    <Shell>
      {/* Header */}
      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
              ParkWise · Silent Gate
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-white">
              Hi, {displayName}!
            </h1>
            <p className="mt-1 text-sm text-white/45">
              {vehicle?.plate ?? "Campus vehicle"}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-400/10 px-3 py-2 text-right ring-1 ring-emerald-300/25">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/70">
              Green Points
            </p>
            <p className="text-base font-bold text-emerald-300">🌱 {GREEN_POINTS} pts</p>
          </div>
        </div>
        {bootError ? (
          <p className="mt-3 rounded-xl bg-amber-400/10 px-3 py-2 text-[11px] text-amber-100 ring-1 ring-amber-300/20">
            Offline demo mode — {bootError}
          </p>
        ) : null}
      </header>

      <div className="space-y-4 pb-8">
        <KillSwitch
          vehicleId={vehicle?.id ?? VEHICLE_ID}
          isLocked={isLocked}
          onChanged={setIsLocked}
        />

        <ZoneMemory
          vehicleId={vehicle?.id ?? VEHICLE_ID}
          zoneMemory={vehicle?.zoneMemory}
          onSaved={(next) => {
            setVehicle(next);
          }}
        />

        <GuestPass vehicleId={vehicle?.id ?? VEHICLE_ID} />

        <NightOwl vehicleId={vehicle?.id ?? VEHICLE_ID} />

        {alerts.length > 0 ? (
          <section className="glass-card rounded-[22px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Recent gate alerts
            </p>
            <ul className="mt-2 space-y-2">
              {alerts.map((msg, idx) => (
                <li
                  key={`${msg}-${idx}`}
                  className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/75"
                >
                  {msg}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(0,104,255,0.28),transparent_55%),radial-gradient(900px_500px_at_90%_0%,rgba(168,85,247,0.18),transparent_50%),#070b14]">
      <div className="mx-auto min-h-screen max-w-md px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
        {children}
      </div>
    </div>
  );
}
