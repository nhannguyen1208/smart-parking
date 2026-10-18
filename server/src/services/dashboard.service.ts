import { Membership, toPublicMembership } from "../models/Membership.js";
import { MembershipPlan } from "../models/MembershipPlan.js";
import {
  ParkingZone,
  getOccupancyLabel,
  toPublicZone,
} from "../models/ParkingZone.js";
import { toPublicUser, type UserDocument } from "../models/User.js";
import { MembershipStatus } from "../types/enums.js";

export async function getActiveMembership(userId: string) {
  const membership = await Membership.findOne({
    userId,
    status: MembershipStatus.ACTIVE,
    endDate: { $gte: new Date() },
  }).sort({ endDate: -1 });

  if (!membership) {
    return null;
  }

  const plan = await MembershipPlan.findById(membership.planId);
  return toPublicMembership(membership, plan ? { name: plan.name, durationDays: plan.durationDays } : undefined);
}

export async function getParkingSummary() {
  const zones = await ParkingZone.find({ isActive: true }).sort({ name: 1 });
  const publicZones = zones.map(toPublicZone);

  const totalCapacity = publicZones.reduce((sum, zone) => sum + zone.capacity, 0);
  const totalOccupied = publicZones.reduce((sum, zone) => sum + zone.occupied, 0);
  const totalAvailable = publicZones.reduce((sum, zone) => sum + zone.available, 0);
  const occupancy =
    totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return {
    totalCapacity,
    totalOccupied,
    totalAvailable,
    occupancy,
    occupancyLabel: getOccupancyLabel(occupancy),
    zones: publicZones,
  };
}

export function getQuickActions() {
  return [
    {
      title: "QR parking pass",
      description: "Backup access when you do not have your student card.",
      href: "/qr-pass",
      actionLabel: "Open QR Pass",
    },
    {
      title: "Automatic access tracking",
      description:
        "Entry and exit activity is updated automatically by the parking system.",
      href: "/parking",
      actionLabel: "View access methods",
    },
    {
      title: "Parking status",
      description: "See occupancy and typical peak periods.",
      href: "/parking",
      actionLabel: "View status",
    },
  ];
}

export async function buildDashboard(user: UserDocument) {
  const [activeMembership, parkingSummary] = await Promise.all([
    getActiveMembership(user._id.toString()),
    getParkingSummary(),
  ]);

  return {
    user: toPublicUser(user),
    activeMembership,
    parkingSummary,
    quickActions: getQuickActions(),
  };
}
