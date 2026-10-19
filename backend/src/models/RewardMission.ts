import { Schema, model, type HydratedDocument } from "mongoose";

const rewardMissionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    /** HH:mm campus local */
    windowStart: { type: String, required: true },
    /** HH:mm campus local */
    windowEnd: { type: String, required: true },
    /** 0=Sun … 6=Sat; empty = every day */
    daysOfWeek: { type: [Number], default: [1, 2, 3, 4, 5] },
    pointsAwarded: { type: Number, required: true, min: 1 },
    /** Max reward-eligible check-ins per student per day for this mission */
    dailyLimitPerStudent: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type RewardMissionDocument = HydratedDocument<{
  name: string;
  description: string;
  windowStart: string;
  windowEnd: string;
  daysOfWeek: number[];
  pointsAwarded: number;
  dailyLimitPerStudent: number;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}>;

export const RewardMission = model("RewardMission", rewardMissionSchema);

export function toPublicMission(mission: RewardMissionDocument) {
  return {
    id: mission._id.toString(),
    name: mission.name,
    description: mission.description,
    windowStart: mission.windowStart,
    windowEnd: mission.windowEnd,
    daysOfWeek: mission.daysOfWeek,
    pointsAwarded: mission.pointsAwarded,
    dailyLimitPerStudent: mission.dailyLimitPerStudent,
    isActive: mission.isActive,
    priority: mission.priority,
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
  };
}
