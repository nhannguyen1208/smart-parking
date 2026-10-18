export type UserRole = "STUDENT" | "GUARD" | "ADMIN";

export type User = {
  id: string;
  studentId: string;
  name: string;
  email: string;
  role: UserRole;
  vehicleNumber: string;
  vehicleType: string;
  createdAt: string;
  updatedAt: string;
};

export type MembershipStatus = "ACTIVE" | "EXPIRED" | "PENDING";

export type ActiveMembership = {
  id: string;
  userId: string;
  planId: string;
  planName?: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  endDateFormatted: string;
  daysLeft: number;
};

export type ParkingZoneStatus = "AVAILABLE" | "NEAR_FULL" | "FULL";

export type ParkingZone = {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  isActive: boolean;
  status: ParkingZoneStatus;
};

export type ParkingSummary = {
  totalCapacity: number;
  totalOccupied: number;
  totalAvailable: number;
  occupancy: number;
  occupancyLabel: string;
  zones: ParkingZone[];
};

export type QuickAction = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
};

export type DashboardData = {
  user: User;
  activeMembership: ActiveMembership | null;
  parkingSummary: ParkingSummary;
  quickActions: QuickAction[];
};

export type MembershipPlan = {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  price: number;
  priceFormatted: string;
  features: string[];
  isActive: boolean;
  featured?: boolean;
};

export type ProfileData = {
  user: User;
  activeMembership: ActiveMembership | null;
};

export type MembershipData = {
  activeMembership: ActiveMembership | null;
  history: ActiveMembership[];
};

export type ApiErrorBody = {
  error: string;
  message: string;
};
