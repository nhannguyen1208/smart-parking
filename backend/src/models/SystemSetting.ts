import { Schema, model } from "mongoose";

const systemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const SystemSetting = model("SystemSetting", systemSettingSchema);
