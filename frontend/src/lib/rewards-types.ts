export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  benefitDays: number;
  validityDays: number;
  progressPct: number;
  pointsToNext: number;
  canRedeem: boolean;
};

export type Mission = {
  id: string;
  name: string;
  description: string;
  windowStart: string;
  windowEnd: string;
  pointsAwarded: number;
  status: string;
  message: string;
  completedToday: boolean;
};

export type HistoryRow = {
  id: string;
  points: number;
  description: string;
  kind: string;
  createdAt: string;
};

export type RedemptionRow = {
  id: string;
  rewardName: string;
  pointsSpent: number;
  benefitDaysRemaining: number;
  validUntil: string;
  status: string;
};

export type RewardsOverview = {
  points: number;
  pointsEarnedToday: number;
  nextReward: (CatalogItem & { pointsToNext: number; progressPct: number }) | null;
  mission: Mission | null;
  catalog: CatalogItem[];
  history: HistoryRow[];
  redemptions: RedemptionRow[];
  timezone: string;
};

export type MissionUiStatus =
  | "UPCOMING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "MISSED"
  | "INACTIVE";
