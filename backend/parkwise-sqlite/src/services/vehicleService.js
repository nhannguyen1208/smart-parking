import {
  findVehicleById,
  findVehicleByOwnerId,
  pushEvent,
  saveZoneMemory,
  setVehicleLocked,
} from "../db.js";

export async function getVehicleForAuth(auth) {
  if (auth?.vehicleId) {
    const byId = await findVehicleById(auth.vehicleId);
    if (byId && byId.ownerId === auth.userId) return byId;
  }
  return findVehicleByOwnerId(auth.userId);
}

export async function toggleVehicleLock({ vehicleId, locked, io }) {
  const vehicle = await findVehicleById(vehicleId);
  if (!vehicle) {
    const err = new Error("Vehicle not found");
    err.code = "VEHICLE_NOT_FOUND";
    err.status = 404;
    throw err;
  }

  const nextLocked =
    typeof locked === "boolean" ? locked : !vehicle.locked;
  const updated = await setVehicleLocked(vehicleId, nextLocked);

  const message = nextLocked
    ? `Kill-Switch ON — ${updated.plate} is secured`
    : `Kill-Switch OFF — ${updated.plate} ready at the gate`;

  const event = await pushEvent({
    type: nextLocked ? "VEHICLE_LOCKED" : "VEHICLE_UNLOCKED",
    vehicleId,
    plate: updated.plate,
    message,
  });

  const payload = { vehicle: updated, event, message };
  io?.emit("vehicle:lock-changed", payload);
  io?.emit("gate-alert", message);
  if (updated.zaloUserId) {
    io?.to(updated.zaloUserId).emit("vehicle:lock-changed", payload);
    io?.to(updated.zaloUserId).emit("gate-alert", message);
  }

  return { vehicle: updated, event, message };
}

export async function updateZone({ vehicleId, zone, row, note, io }) {
  const vehicle = await findVehicleById(vehicleId);
  if (!vehicle) {
    const err = new Error("Vehicle not found");
    err.code = "VEHICLE_NOT_FOUND";
    err.status = 404;
    throw err;
  }

  const updated = await saveZoneMemory(vehicleId, { zone, row, note });
  if (updated.zaloUserId) {
    io?.to(updated.zaloUserId).emit("zone:updated", {
      vehicleId,
      zoneMemory: updated.zoneMemory,
    });
  }
  return updated;
}
