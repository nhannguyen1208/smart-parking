import { useEffect, useState } from "react";
import { Button } from "./zmp/Button";
import { api } from "../lib/api";

const ZONE_OPTIONS = ["Zone A", "Zone B", "Zone C", "Zone D · Basement"];
const ROW_OPTIONS = ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5"];

export default function ZoneMemory({ zoneMemory, onSaved }) {
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
      const data = await api.saveZone({ zone, row, note });
      onSaved?.(data.vehicle);
    } catch (err) {
      setError(err.message || "Could not save location");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 rounded-[16px] border border-border/80 bg-gradient-to-br from-white to-brand-light/40 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-muted">Last parked</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-navy">
          {zoneMemory ? `${zoneMemory.zone}, ${zoneMemory.row}` : "No spot saved yet"}
        </p>
        {zoneMemory?.note ? (
          <p className="mt-1 text-xs text-muted">{zoneMemory.note}</p>
        ) : null}
      </div>

      <form className="space-y-2.5" onSubmit={handleSave}>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted">Zone</span>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="h-11 w-full appearance-none rounded-[12px] border border-border bg-white px-3 text-sm text-navy outline-none focus:border-brand-blue/40"
          >
            {ZONE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted">Row</span>
          <select
            value={row}
            onChange={(e) => setRow(e.target.value)}
            className="h-11 w-full appearance-none rounded-[12px] border border-border bg-white px-3 text-sm text-navy outline-none focus:border-brand-blue/40"
          >
            {ROW_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted">
            Note (optional)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Near elevator / pillar B2"
            className="h-11 w-full rounded-[12px] border border-border bg-white px-3 text-sm text-navy outline-none placeholder:text-muted/70 focus:border-brand-blue/40"
          />
        </label>

        {error ? (
          <p className="text-xs text-[#b91c1c]">{error}</p>
        ) : null}

        <Button type="submit" disabled={saving} className="mt-1 w-full">
          {saving ? "Saving…" : "Save location"}
        </Button>
      </form>
    </div>
  );
}
