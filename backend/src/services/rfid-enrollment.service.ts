import { writeAudit } from "../models/AuditLog.js";
import {
  displaySuffixFromRaw,
  hashCredentialToken,
  RfidCredential,
  toPublicRfid,
} from "../models/RfidCredential.js";
import { User } from "../models/User.js";
import {
  RfidCredentialStatus,
  RfidCredentialType,
  UserRole,
} from "../types/enums.js";

export type EnrollResult = {
  id: string;
  ownerId: string;
  vehicleId: string | null;
  credentialType: string;
  displaySuffix: string;
  status: string;
  issuedAt: Date;
  revokedAt: Date | null;
  studentId: string;
  reassigned?: boolean;
};

export class EnrollError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function enrollRfidCard(input: {
  rawToken: string;
  studentId: string;
  replace?: boolean;
  actorId: string;
}): Promise<EnrollResult> {
  const rawToken = input.rawToken.trim().toUpperCase();
  const studentId = input.studentId.trim();
  const replace = Boolean(input.replace);

  if (!rawToken || rawToken.length < 4) {
    throw new EnrollError("VALIDATION_ERROR", "rawToken (UID) required", 400);
  }
  if (!studentId) {
    throw new EnrollError("VALIDATION_ERROR", "studentId required", 400);
  }

  const student = await User.findOne({
    studentId,
    role: UserRole.STUDENT,
  });
  if (!student) {
    throw new EnrollError("NOT_FOUND", "Student not found", 404);
  }

  const tokenHash = hashCredentialToken(rawToken);
  const existing = await RfidCredential.findOne({ tokenHash });
  if (existing) {
    if (!replace) {
      throw new EnrollError(
        "CONFLICT",
        "This card UID is already registered",
        409,
      );
    }
    existing.ownerId = student._id;
    existing.vehicleId = undefined;
    existing.status = RfidCredentialStatus.ACTIVE;
    existing.displaySuffix = displaySuffixFromRaw(rawToken);
    existing.revokedAt = undefined;
    existing.revokeReason = "";
    await existing.save();
    await writeAudit({
      actorId: input.actorId,
      action: "RFID_REASSIGN",
      targetType: "RfidCredential",
      targetId: existing._id.toString(),
      reason: `Reassigned UID …${displaySuffixFromRaw(rawToken)} → ${studentId}`,
    });
    return {
      ...toPublicRfid(existing),
      studentId: student.studentId,
      reassigned: true,
    };
  }

  if (replace) {
    await RfidCredential.updateMany(
      { ownerId: student._id, status: RfidCredentialStatus.ACTIVE },
      {
        $set: {
          status: RfidCredentialStatus.REVOKED,
          revokedAt: new Date(),
          revokeReason: "Replaced by Guard enrollment",
        },
      },
    );
  }

  const cred = await RfidCredential.create({
    ownerId: student._id,
    credentialType: RfidCredentialType.STUDENT_CARD,
    tokenHash,
    displaySuffix: displaySuffixFromRaw(rawToken),
    status: RfidCredentialStatus.ACTIVE,
  });

  await writeAudit({
    actorId: input.actorId,
    action: "RFID_REGISTER",
    targetType: "RfidCredential",
    targetId: cred._id.toString(),
    reason: `Registered UID …${cred.displaySuffix} for ${studentId}`,
  });

  return {
    ...toPublicRfid(cred),
    studentId: student.studentId,
  };
}

/** In-memory: Guard bấm Quét → ESP32 quét → tự enroll */
export type CaptureSession = {
  guardId: string;
  studentId: string;
  replace: boolean;
  startedAt: number;
  expiresAt: number;
  status: "waiting" | "registered" | "error" | "expired";
  credentialRaw?: string;
  card?: EnrollResult;
  error?: string;
};

const CAPTURE_TTL_MS = 60_000;
const captures = new Map<string, CaptureSession>();

export function startRfidCapture(input: {
  guardId: string;
  studentId: string;
  replace?: boolean;
}): CaptureSession {
  const now = Date.now();
  const session: CaptureSession = {
    guardId: input.guardId,
    studentId: input.studentId.trim(),
    replace: input.replace !== false,
    startedAt: now,
    expiresAt: now + CAPTURE_TTL_MS,
    status: "waiting",
  };
  captures.set(input.guardId, session);
  return session;
}

export function getRfidCapture(guardId: string): CaptureSession | null {
  const s = captures.get(guardId);
  if (!s) return null;
  if (s.status === "waiting" && Date.now() > s.expiresAt) {
    s.status = "expired";
    s.error = "Hết thời gian chờ quét (60s) — bấm Quét lại";
  }
  return s;
}

export function cancelRfidCapture(guardId: string) {
  captures.delete(guardId);
}

/** Gọi mỗi khi ESP32 gửi UID — tự đăng ký nếu Guard đang chờ quét */
export async function onDeviceCredentialScanned(
  credentialRaw: string,
): Promise<{ enrolledForGuard?: string; card?: EnrollResult }> {
  const raw = credentialRaw.trim().toUpperCase();
  if (!raw) return {};

  const now = Date.now();
  for (const [guardId, session] of captures) {
    if (session.status !== "waiting") continue;
    if (now > session.expiresAt) {
      session.status = "expired";
      session.error = "Hết thời gian chờ quét (60s)";
      continue;
    }
    session.credentialRaw = raw;
    try {
      const card = await enrollRfidCard({
        rawToken: raw,
        studentId: session.studentId,
        replace: session.replace,
        actorId: guardId,
      });
      session.status = "registered";
      session.card = card;
      return { enrolledForGuard: guardId, card };
    } catch (err) {
      session.status = "error";
      session.error =
        err instanceof EnrollError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Enroll failed";
      return { enrolledForGuard: guardId };
    }
  }
  return {};
}

export function toPublicCapture(s: CaptureSession) {
  return {
    status: s.status,
    studentId: s.studentId,
    expiresAt: new Date(s.expiresAt).toISOString(),
    remainingMs: Math.max(0, s.expiresAt - Date.now()),
    credentialRaw: s.credentialRaw ?? null,
    card: s.card ?? null,
    error: s.error ?? null,
  };
}
