import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function toPublicVehicle(vehicle) {
  if (!vehicle) return null;
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    rfidTag: vehicle.rfidTag,
    ownerName: vehicle.ownerName,
    zaloUserId: vehicle.zaloUserId,
    locked: vehicle.locked,
    zoneMemory:
      vehicle.zone && vehicle.row
        ? {
            zone: vehicle.zone,
            row: vehicle.row,
            note: vehicle.note ?? "",
            savedAt: vehicle.zoneSavedAt?.toISOString?.() ?? vehicle.zoneSavedAt,
          }
        : null,
    updatedAt: vehicle.updatedAt?.toISOString?.() ?? vehicle.updatedAt,
    createdAt: vehicle.createdAt?.toISOString?.() ?? vehicle.createdAt,
  };
}

export function toPublicGuestPass(pass) {
  if (!pass) return null;
  return {
    code: pass.code,
    vehicleId: pass.vehicleId,
    hostPlate: pass.hostPlate,
    hostZaloUserId: pass.hostZaloUserId,
    guestName: pass.guestName,
    status: pass.status,
    createdAt: pass.createdAt?.toISOString?.() ?? pass.createdAt,
    expiresAt: pass.expiresAt?.toISOString?.() ?? pass.expiresAt,
    usedAt: pass.usedAt ? pass.usedAt.toISOString?.() ?? pass.usedAt : null,
  };
}

export function toPublicEvent(event) {
  let extra = {};
  if (event.payload) {
    try {
      extra = JSON.parse(event.payload);
    } catch {
      extra = {};
    }
  }
  return {
    id: event.id,
    type: event.type,
    message: event.message,
    vehicleId: event.vehicleId,
    at: event.createdAt?.toISOString?.() ?? event.createdAt,
    ...extra,
  };
}

export async function findVehicleById(vehicleId) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  return toPublicVehicle(vehicle);
}

export async function findVehicleByRfid(rfidTag) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { rfidTag: { equals: String(rfidTag) } },
  });
  return toPublicVehicle(vehicle);
}

export async function setVehicleLocked(vehicleId, locked) {
  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { locked: Boolean(locked) },
  });
  return toPublicVehicle(vehicle);
}

export async function saveZoneMemory(vehicleId, zoneMemory) {
  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      zone: zoneMemory.zone,
      row: zoneMemory.row,
      note: zoneMemory.note ?? "",
      zoneSavedAt: new Date(),
    },
  });
  return toPublicVehicle(vehicle);
}

export async function addGuestPass(pass) {
  const created = await prisma.guestPass.create({
    data: {
      code: pass.code,
      vehicleId: pass.vehicleId,
      hostPlate: pass.hostPlate,
      hostZaloUserId: pass.hostZaloUserId,
      guestName: pass.guestName,
      status: pass.status ?? "ACTIVE",
      expiresAt: new Date(pass.expiresAt),
      usedAt: pass.usedAt ? new Date(pass.usedAt) : null,
    },
  });
  return toPublicGuestPass(created);
}

export async function findGuestPass(code) {
  const pass = await prisma.guestPass.findFirst({
    where: { code: { equals: String(code) } },
  });
  return toPublicGuestPass(pass);
}

export async function markGuestPassUsed(code) {
  const existing = await prisma.guestPass.findFirst({
    where: { code: { equals: String(code) } },
  });
  if (!existing) return null;
  const pass = await prisma.guestPass.update({
    where: { id: existing.id },
    data: { status: "USED", usedAt: new Date() },
  });
  return toPublicGuestPass(pass);
}

export async function pushEvent(event) {
  const { type, message, vehicleId, ...rest } = event;
  const created = await prisma.event.create({
    data: {
      type,
      message: message ?? null,
      vehicleId: vehicleId ?? null,
      payload: Object.keys(rest).length ? JSON.stringify(rest) : null,
    },
  });

  // Keep table lean
  const count = await prisma.event.count();
  if (count > 200) {
    const old = await prisma.event.findMany({
      orderBy: { createdAt: "asc" },
      take: count - 200,
      select: { id: true },
    });
    await prisma.event.deleteMany({
      where: { id: { in: old.map((e) => e.id) } },
    });
  }

  return toPublicEvent(created);
}

export async function listEvents(limit = 30) {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return events.map(toPublicEvent);
}

export { prisma };
