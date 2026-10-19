import { Schema, model, Types } from "mongoose";

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String, default: "" },
    reason: { type: String, default: "" },
    correlationId: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AuditLog = model("AuditLog", auditLogSchema);

export async function writeAudit(input: {
  actorId?: Types.ObjectId | string | null;
  action: string;
  targetType: string;
  targetId?: string;
  reason?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}) {
  await AuditLog.create({
    actorId: input.actorId || undefined,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? "",
    reason: input.reason ?? "",
    correlationId: input.correlationId ?? "",
    metadata: input.metadata ?? {},
  });
}
