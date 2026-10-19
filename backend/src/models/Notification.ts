import { Schema, model } from "mongoose";
import { NotificationStatus } from "../types/enums.js";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    channel: { type: String, default: "IN_APP" },
    type: { type: String, required: true },
    contentKey: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.DEMO,
    },
    providerMessageId: { type: String, default: "" },
    sentAt: { type: Date },
    failureReason: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Notification = model("Notification", notificationSchema);
