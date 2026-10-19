import { Membership, toPublicMembership } from "../models/Membership.js";
import { MembershipPlan } from "../models/MembershipPlan.js";
import { ParkingLot, toPublicLot } from "../models/ParkingLot.js";
import { getOccupancyLabel } from "../models/ParkingZone.js";
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
  const lots = await ParkingLot.find().sort({ code: 1 });
  const publicZones = lots.map((lot) => {
    const pub = toPublicLot(lot);
    return {
      id: pub.id,
      name: pub.name,
      capacity: pub.totalCapacity,
      occupied: pub.currentOccupancyEstimate,
      available: pub.availableEstimate,
      isActive: true,
      status: pub.status === "NEARLY_FULL" ? "NEARLY_FULL" : pub.status,
      estimated: true,
      createdAt: lot.createdAt,
      updatedAt: lot.updatedAt,
    };
  });

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
    estimated: true,
  };
}

export function getQuickActions() {
  return [
    {
      title: "Backup Pass",
      description: "",
      href: "/qr-pass",
      actionLabel: "Open",
    },
    {
      title: "History",
      description: "",
      href: "/history",
      actionLabel: "View",
    },
    {
      title: "Parking",
      description: "",
      href: "/parking",
      actionLabel: "View",
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
