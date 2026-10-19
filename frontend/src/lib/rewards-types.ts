export type BlindPrizePreview = {
  key: string;
  name: string;
  rarity: "common" | "lucky" | "rare" | "epic" | string;
  benefitDays: number;
  image?: string;
};

export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  benefitDays: number;
  validityDays: number;
  isBlindBox?: boolean;
  prizePreview?: BlindPrizePreview[];
  progressPct: number;
  pointsToNext: number;
  canRedeem: boolean;
};

export type BlindRevealResult = {
  prize: BlindPrizePreview;
  prizePreview: BlindPrizePreview[];
  message: string;
  points: number;
  wonDays?: number;
  isBlindBox?: boolean;
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
  prizeImage?: string;
  prizeKey?: string;
  pointsSpent: number;
  benefitDaysTotal?: number;
  benefitDaysRemaining: number;
  validUntil: string;
  validFrom?: string;
  status: string;
  createdAt?: string;
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
