import mongoose from "mongoose";
import { env } from "../config/env.js";
import {
  ParkingReward,
  rollBlindPrize,
  toPublicParkingReward,
  type ParkingRewardDocument,
} from "../models/ParkingReward.js";
import {
  RedemptionStatus,
  RewardRedemption,
  toPublicRedemption,
} from "../models/RewardRedemption.js";
import {
  RewardMission,
  toPublicMission,
  type RewardMissionDocument,
} from "../models/RewardMission.js";
import {
  RewardTransaction,
  toPublicRewardTx,
} from "../models/RewardTransaction.js";
import {
  parseHm,
  vnDayKey,
  vnMinutesOfDay,
  vnWeekday,
} from "../utils/vnTime.js";

export type MissionUiStatus =
  | "UPCOMING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "MISSED"
  | "INACTIVE";

function missionReason(missionId: string) {
  return `MISSION:${missionId}`;
}

export function isWithinMissionWindow(
  mission: RewardMissionDocument,
  at: Date,
): boolean {
  if (!mission.isActive) return false;
  const days = mission.daysOfWeek?.length
    ? mission.daysOfWeek
    : [0, 1, 2, 3, 4, 5, 6];
  if (!days.includes(vnWeekday(at))) return false;
  const start = parseHm(mission.windowStart);
  const end = parseHm(mission.windowEnd);
  const now = vnMinutesOfDay(at);
  if (start <= end) return now >= start && now <= end;
  // overnight window
  return now >= start || now <= end;
}

export async function getPointsBalance(userId: string) {
  const rows = await RewardTransaction.aggregate<{ total: number }>([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: "$points" } } },
  ]);
  return rows[0]?.total ?? 0;
}

export async function getActiveMission() {
  return RewardMission.findOne({ isActive: true }).sort({
    priority: -1,
    createdAt: -1,
  });
}

export async function evaluateMissionOnEntry(input: {
  userId: string;
  occurredAt: Date;
  eventId: string;
}): Promise<{ awarded: boolean; points: number; missionName?: string; skipReason?: string }> {
  if (env.FEATURE_REWARDS === "false") {
    return { awarded: false, points: 0, skipReason: "FEATURE_OFF" };
  }

  // Any successful student check-in (RFID, plate/LPR, DEMO sim, …) can earn
  // points when it falls inside the active mission window — once per day.
  const mission = await getActiveMission();
  if (!mission || !isWithinMissionWindow(mission, input.occurredAt)) {
    return { awarded: false, points: 0, skipReason: "OUTSIDE_WINDOW" };
  }

  const dayKey = vnDayKey(input.occurredAt);
  const reason = missionReason(mission._id.toString());

  try {
    await RewardTransaction.create({
      userId: input.userId,
      points: mission.pointsAwarded,
      reason,
      description: `${mission.name} (+${mission.pointsAwarded} pts)`,
      relatedEventId: input.eventId,
      dayKey,
      missionId: mission._id,
      kind: "EARN",
    });
    return {
      awarded: true,
      points: mission.pointsAwarded,
      missionName: mission.name,
    };
  } catch {
    // unique index — already awarded today for this mission
    return { awarded: false, points: 0, skipReason: "ALREADY_EARNED" };
  }
}

async function missionStatusForUser(
  mission: RewardMissionDocument | null,
  userId: string,
  now = new Date(),
): Promise<{
  status: MissionUiStatus;
  message: string;
  completedToday: boolean;
  pointsEarnedToday: number;
}> {
  if (!mission || !mission.isActive) {
    return {
      status: "INACTIVE",
      message: "No active challenge right now. Check back soon.",
      completedToday: false,
      pointsEarnedToday: 0,
    };
  }

  const dayKey = vnDayKey(now);
  const earnToday = await RewardTransaction.findOne({
    userId,
    dayKey,
    reason: missionReason(mission._id.toString()),
    kind: "EARN",
  });

  if (earnToday) {
    return {
      status: "COMPLETED",
      message: `Nice work! You earned ${earnToday.points} points.`,
      completedToday: true,
      pointsEarnedToday: earnToday.points,
    };
  }

  const days = mission.daysOfWeek?.length
    ? mission.daysOfWeek
    : [0, 1, 2, 3, 4, 5, 6];
  if (!days.includes(vnWeekday(now))) {
    return {
      status: "MISSED",
      message: "No challenge today — you can join the next one.",
      completedToday: false,
      pointsEarnedToday: 0,
    };
  }

  const start = parseHm(mission.windowStart);
  const end = parseHm(mission.windowEnd);
  const mins = vnMinutesOfDay(now);

  if (mins < start) {
    return {
      status: "UPCOMING",
      message: `Your mission starts at ${mission.windowStart}.`,
      completedToday: false,
      pointsEarnedToday: 0,
    };
  }
  if (mins <= end) {
    return {
      status: "IN_PROGRESS",
      message: "You're in the reward window. Scan your card as usual.",
      completedToday: false,
      pointsEarnedToday: 0,
    };
  }
  return {
    status: "MISSED",
    message: "No worries — you can join the next challenge.",
    completedToday: false,
    pointsEarnedToday: 0,
  };
}

export async function getStudentRewardsOverview(
  userId: string,
  asOf: Date = new Date(),
) {
  const [points, mission, catalog, history, redemptions] = await Promise.all([
    getPointsBalance(userId),
    getActiveMission(),
    ParkingReward.find({ isActive: true }).sort({ sortOrder: 1, pointsCost: 1 }),
    RewardTransaction.find({ userId }).sort({ createdAt: -1 }).limit(50),
    RewardRedemption.find({ userId }).sort({ createdAt: -1 }).limit(20),
  ]);

  const missionState = await missionStatusForUser(mission, userId, asOf);
  const nextReward =
    catalog.find((r) => r.pointsCost > points) ??
    catalog[catalog.length - 1] ??
    null;

  const pointsToNext = nextReward
    ? Math.max(0, nextReward.pointsCost - points)
    : 0;
  const progressPct = nextReward
    ? Math.min(100, Math.round((points / nextReward.pointsCost) * 100))
    : points > 0
      ? 100
      : 0;

  return {
    points,
    pointsEarnedToday: missionState.pointsEarnedToday,
    nextReward: nextReward
      ? {
          ...toPublicParkingReward(nextReward),
          pointsToNext,
          progressPct,
          canRedeem: points >= nextReward.pointsCost,
        }
      : null,
    mission: mission
      ? {
          ...toPublicMission(mission),
          status: missionState.status,
          message: missionState.message,
          completedToday: missionState.completedToday,
        }
      : null,
    catalog: catalog.map((r) => ({
      ...toPublicParkingReward(r),
      progressPct: Math.min(100, Math.round((points / r.pointsCost) * 100)),
      pointsToNext: Math.max(0, r.pointsCost - points),
      canRedeem: points >= r.pointsCost && r.isActive,
    })),
    history: history.map((tx) => toPublicRewardTx(tx)),
    redemptions: redemptions.map(toPublicRedemption),
    timezone: "Asia/Ho_Chi_Minh",
  };
}

export async function redeemParkingReward(userId: string, rewardId: string) {
  if (!mongoose.isValidObjectId(rewardId)) {
    const err = new Error("Invalid reward");
    (err as Error & { code: string; status: number }).code = "INVALID_REWARD";
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const reward = await ParkingReward.findOne({
    _id: rewardId,
    isActive: true,
  });

  if (!reward) {
    const err = new Error("That reward is not available.");
    (err as Error & { code: string; status: number }).code = "REWARD_UNAVAILABLE";
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  const balance = await getPointsBalance(userId);
  if (balance < reward.pointsCost) {
    const err = new Error("Not enough points to redeem this reward.");
    (err as Error & { code: string; status: number }).code = "INSUFFICIENT_POINTS";
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + reward.validityDays);
  const redemptionId = new mongoose.Types.ObjectId();
  const prize = rollBlindPrize(reward);
  const wonDays = Math.max(0, prize.benefitDays);

  // Ledger row first with unique reason — concurrent duplicates fail the unique index
  try {
    await RewardTransaction.create({
      userId,
      points: -reward.pointsCost,
      reason: `REDEEM:${redemptionId.toString()}`,
      description: reward.isBlindBox
        ? `Opened ${reward.name} (−${reward.pointsCost} pts) → ${prize.name}`
        : `Redeemed ${reward.name} (−${reward.pointsCost} pts)`,
      dayKey: vnDayKey(now),
      redemptionId,
      kind: "SPEND",
    });
  } catch {
    const err = new Error("Could not complete redemption. Please try again.");
    (err as Error & { code: string; status: number }).code = "REDEEM_CONFLICT";
    (err as Error & { status: number }).status = 409;
    throw err;
  }

  const afterSpend = await getPointsBalance(userId);
  if (afterSpend < 0) {
    await RewardTransaction.deleteOne({ redemptionId });
    const err = new Error("Not enough points to redeem this reward.");
    (err as Error & { code: string; status: number }).code = "INSUFFICIENT_POINTS";
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const redemption = await RewardRedemption.create({
    _id: redemptionId,
    userId,
    rewardId: reward._id,
    pointsSpent: reward.pointsCost,
    benefitDaysTotal: wonDays,
    benefitDaysRemaining: wonDays,
    validFrom: now,
    validUntil,
    status: wonDays > 0 ? RedemptionStatus.ACTIVE : RedemptionStatus.EXHAUSTED,
    rewardName: prize.name,
    prizeImage: prize.image || "",
    prizeKey: prize.key,
  });

  return {
    redemption: toPublicRedemption(redemption),
    points: afterSpend,
    wonDays,
    isBlindBox: Boolean(reward.isBlindBox),
    prize: {
      key: prize.key,
      name: prize.name,
      rarity: prize.rarity,
      benefitDays: wonDays,
      image: prize.image || "",
    },
    prizePreview: reward.isBlindBox
      ? (reward.blindPrizes ?? []).map((p) => ({
          key: p.key,
          name: p.name,
          rarity: p.rarity,
          benefitDays: p.benefitDays,
          image: p.image || "",
        }))
      : [],
    message: reward.isBlindBox
      ? `You got: ${prize.name}!`
      : `${prize.name} activated${wonDays > 0 ? ` — ${wonDays} free parking day${wonDays === 1 ? "" : "s"}` : ""}.`,
  };
}

// ── Admin helpers ──────────────────────────────────────────

export async function listMissionsAdmin() {
  const rows = await RewardMission.find().sort({ priority: -1, createdAt: -1 });
  return rows.map(toPublicMission);
}

export async function upsertMission(
  id: string | null,
  body: Partial<{
    name: string;
    description: string;
    windowStart: string;
    windowEnd: string;
    daysOfWeek: number[];
    pointsAwarded: number;
    dailyLimitPerStudent: number;
    isActive: boolean;
    priority: number;
  }>,
) {
  if (id) {
    const row = await RewardMission.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!row) throw Object.assign(new Error("Mission not found"), { status: 404 });
    return toPublicMission(row);
  }
  const row = await RewardMission.create({
    name: body.name || "Early Arrival Challenge",
    description:
      body.description ||
      "Arrive during today's selected time window and earn points.",
    windowStart: body.windowStart || "07:10",
    windowEnd: body.windowEnd || "07:20",
    daysOfWeek: body.daysOfWeek ?? [1, 2, 3, 4, 5],
    pointsAwarded: body.pointsAwarded ?? 10,
    dailyLimitPerStudent: body.dailyLimitPerStudent ?? 1,
    isActive: body.isActive ?? true,
    priority: body.priority ?? 0,
  });
  return toPublicMission(row);
}

export async function listCatalogAdmin() {
  const rows = await ParkingReward.find().sort({ sortOrder: 1 });
  return rows.map(toPublicParkingReward);
}

export async function upsertCatalogReward(
  id: string | null,
  body: Partial<{
    name: string;
    description: string;
    pointsCost: number;
    benefitDays: number;
    validityDays: number;
    isActive: boolean;
    sortOrder: number;
  }>,
) {
  if (id) {
    const row = await ParkingReward.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!row) throw Object.assign(new Error("Reward not found"), { status: 404 });
    return toPublicParkingReward(row);
  }
  const row = await ParkingReward.create({
    name: body.name || "Parking Pass",
    description: body.description || "Free parking days",
    pointsCost: body.pointsCost ?? 100,
    benefitDays: body.benefitDays ?? 5,
    validityDays: body.validityDays ?? 30,
    isActive: body.isActive ?? true,
    sortOrder: body.sortOrder ?? 0,
  });
  return toPublicParkingReward(row);
}

export async function adminRewardsStats() {
  const [awarded, spent, redemptions, missions] = await Promise.all([
    RewardTransaction.aggregate([
      { $match: { kind: "EARN" } },
      { $group: { _id: null, points: { $sum: "$points" }, count: { $sum: 1 } } },
    ]),
    RewardTransaction.aggregate([
      { $match: { kind: "SPEND" } },
      { $group: { _id: null, points: { $sum: "$points" }, count: { $sum: 1 } } },
    ]),
    RewardRedemption.countDocuments(),
    RewardMission.countDocuments({ isActive: true }),
  ]);
  return {
    earnEvents: awarded[0]?.count ?? 0,
    pointsAwarded: awarded[0]?.points ?? 0,
    redeemEvents: spent[0]?.count ?? 0,
    pointsSpent: Math.abs(spent[0]?.points ?? 0),
    redemptions,
    activeMissions: missions,
  };
}

export type { ParkingRewardDocument };
