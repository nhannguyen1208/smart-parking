import { useEffect, useState } from "react";
import { api } from "../lib/api";

const ZONE_OPTIONS = ["Zone A", "Zone B", "Zone C", "Zone D · Basement"];
const ROW_OPTIONS = ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5"];

export default function ZoneMemory({
  vehicleId = "veh_001",
  zoneMemory,
  onSaved,
}) {
  const [zone, setZone] = useState(zoneMemory?.zone ?? "Zone A");
  const [row, setRow] = useState(zoneMemory?.row ?? "Row 3");
  const [note, setNote] = useState(zoneMemory?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!zoneMemory) return;
    setZone(zoneMemory.zone ?? "Zone A");
    setRow(zoneMemory.row ?? "Row 3");
    setNote(zoneMemory.note ?? "");
  }, [zoneMemory?.zone, zoneMemory?.row, zoneMemory?.note, zoneMemory?.savedAt]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await api.saveZone({ vehicleId, zone, row, note });
      onSaved?.(data.vehicle);
    } catch (err) {
      setError(err.message || "Could not save location");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-card rounded-[24px] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Zone Memory
          </p>
          <h2 className="mt-1 text-base font-semibold text-white">Parked location</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-lg">
          📍
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/10 px-4 py-3 ring-1 ring-sky-400/20">
        <p className="text-[11px] uppercase tracking-wide text-sky-200/70">Last parked</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-white">
          {zoneMemory
            ? `${zoneMemory.zone}, ${zoneMemory.row}`
            : "No spot saved yet"}
        </p>
        {zoneMemory?.note ? (
          <p className="mt-1 text-xs text-white/55">{zoneMemory.note}</p>
        ) : null}
      </div>

      <form className="space-y-2.5" onSubmit={handleSave}>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-white/45">Zone</span>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-sky-400/50"
          >
            {ZONE_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-[#0f172a] text-white">
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-white/45">Row</span>
          <select
            value={row}
            onChange={(e) => setRow(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-sky-400/50"
          >
            {ROW_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-[#0f172a] text-white">
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-white/45">
            Note (optional)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Near elevator / pillar B2"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-sky-400/50"
          />
        </label>

        {error ? <p className="text-xs text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="mt-1 h-11 w-full rounded-xl bg-white text-sm font-semibold text-[#0b1f3a] transition hover:bg-sky-50 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save location"}
        </button>
      </form>
    </section>
  );
}
