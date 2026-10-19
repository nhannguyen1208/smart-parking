import { PrismaClient } from "@prisma/client";
import { maskPhone, normalizePhone } from "./phone.js";

const prisma = new PrismaClient();

export function toPublicVehicle(vehicle) {
  if (!vehicle) return null;
  const zaloUserId = vehicle.owner?.zaloUserId ?? vehicle.zaloUserId ?? null;
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    rfidTag: vehicle.rfidTag,
    ownerName: vehicle.ownerName,
    ownerId: vehicle.ownerId,
    zaloUserId,
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

export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    zaloUserId: user.zaloUserId,
    phone: user.phone ?? null,
    phoneMasked: maskPhone(user.phone),
    displayName: user.displayName,
    studentId: user.studentId ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
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

export function toPublicSafeRide(session) {
  if (!session) return null;
  return {
    token: session.token,
    vehicleId: session.vehicleId,
    status: session.status,
    createdAt: session.createdAt?.toISOString?.() ?? session.createdAt,
    expiresAt: session.expiresAt?.toISOString?.() ?? session.expiresAt,
    lastLocation:
      session.lastLat != null && session.lastLng != null
        ? {
            latitude: session.lastLat,
            longitude: session.lastLng,
            at: session.lastAt?.toISOString?.() ?? session.lastAt,
          }
        : null,
    plate: session.vehicle?.plate,
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

const vehicleInclude = { owner: true };

export async function findUserByZaloId(zaloUserId) {
  return prisma.user.findUnique({ where: { zaloUserId: String(zaloUserId) } });
}

export async function findUserByPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return prisma.user.findUnique({ where: { phone: normalized } });
}

/**
 * Identify (or create) a campus account by phone number.
 * Links zaloUserId when provided.
 */
export async function ensureUserByPhone({
  phone,
  zaloUserId,
  displayName,
}) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw Object.assign(new Error("Invalid phone number"), {
      code: "VALIDATION_ERROR",
      status: 400,
    });
  }

  let user = await findUserByPhone(normalized);

  if (!user && zaloUserId) {
    user = await findUserByZaloId(zaloUserId);
    if (user && !user.phone) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phone: normalized },
      });
    }
  }

  if (!user) {
    const id = `user_${normalized}`;
    const name = displayName?.trim() || `SV ${normalized.slice(-4)}`;
    user = await prisma.user.create({
      data: {
        id,
        zaloUserId: zaloUserId || `zalo_phone_${normalized}`,
        phone: normalized,
        displayName: name,
      },
    });

    const vehicleId = `veh_${normalized.slice(-8)}`;
    await prisma.vehicle.create({
      data: {
        id: vehicleId,
        plate: `TMP-${normalized.slice(-6)}`,
        rfidTag: `RFID-${normalized.slice(-8)}`,
        ownerName: name,
        ownerId: user.id,
        locked: false,
      },
    });
  } else if (zaloUserId && user.zaloUserId !== zaloUserId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        zaloUserId,
        displayName: displayName?.trim() || user.displayName,
        phone: normalized,
      },
    });
  } else if (displayName?.trim() && displayName !== user.displayName) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { displayName: displayName.trim() },
    });
  }

  return user;
}

export async function findVehicleByOwnerId(ownerId) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { ownerId },
    include: vehicleInclude,
  });
  return toPublicVehicle(vehicle);
}

export async function findVehicleById(vehicleId) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: vehicleInclude,
  });
  return toPublicVehicle(vehicle);
}

export async function findVehicleByRfid(rfidTag) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { rfidTag: { equals: String(rfidTag) } },
    include: vehicleInclude,
  });
  return toPublicVehicle(vehicle);
}

export async function setVehicleLocked(vehicleId, locked) {
  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { locked: Boolean(locked) },
    include: vehicleInclude,
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
    include: vehicleInclude,
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

export async function createSafeRideSession({
  token,
  vehicleId,
  expiresAt,
  latitude,
  longitude,
}) {
  const created = await prisma.safeRideSession.create({
    data: {
      token,
      vehicleId,
      status: "ACTIVE",
      expiresAt: new Date(expiresAt),
      lastLat: latitude ?? null,
      lastLng: longitude ?? null,
      lastAt: latitude != null && longitude != null ? new Date() : null,
    },
    include: { vehicle: true },
  });
  return toPublicSafeRide(created);
}

export async function findSafeRideSession(token) {
  const session = await prisma.safeRideSession.findUnique({
    where: { token: String(token) },
    include: { vehicle: true },
  });
  return toPublicSafeRide(session);
}

export async function updateSafeRideLocation(token, { latitude, longitude }) {
  const existing = await prisma.safeRideSession.findUnique({
    where: { token: String(token) },
  });
  if (!existing) return null;
  const session = await prisma.safeRideSession.update({
    where: { id: existing.id },
    data: {
      lastLat: Number(latitude),
      lastLng: Number(longitude),
      lastAt: new Date(),
    },
    include: { vehicle: true },
  });
  return toPublicSafeRide(session);
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

export async function listEvents(limit = 30, vehicleId) {
  const events = await prisma.event.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return events.map(toPublicEvent);
}

export { prisma };
