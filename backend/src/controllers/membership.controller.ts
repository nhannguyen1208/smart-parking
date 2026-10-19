import type { Response } from "express";
import mongoose from "mongoose";
import { Membership, toPublicMembership } from "../models/Membership.js";
import {
  MembershipPlan,
  toPublicPlan,
} from "../models/MembershipPlan.js";
import { GuestPass } from "../models/GuestPass.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sendData, sendError } from "../utils/apiResponse.js";
import { getActiveMembership } from "../services/dashboard.service.js";
import { GuestPassStatus, MembershipStatus } from "../types/enums.js";

export async function getMembership(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!._id.toString();
  const activeMembership = await getActiveMembership(userId);
  const history = await Membership.find({ userId }).sort({ createdAt: -1 }).limit(10);
  const planIds = history.map((item) => item.planId);
  const plans = await MembershipPlan.find({ _id: { $in: planIds } });
  const planMap = new Map(plans.map((plan) => [plan._id.toString(), plan]));

  return sendData(res, {
    activeMembership,
    history: history.map((membership) =>
      toPublicMembership(
        membership,
        planMap.get(membership.planId.toString())
          ? {
              name: planMap.get(membership.planId.toString())!.name,
              durationDays: planMap.get(membership.planId.toString())!.durationDays,
            }
          : undefined,
      ),
    ),
  });
}

export async function getMembershipPlans(_req: AuthenticatedRequest, res: Response) {
  const plans = await MembershipPlan.find({ isActive: true }).sort({ durationDays: 1 });
  const featuredPlanId = plans.find((plan) => plan.durationDays === 30)?._id.toString();

  return sendData(res, {
    plans: plans.map((plan) => ({
      ...toPublicPlan(plan),
      featured: plan._id.toString() === featuredPlanId,
    })),
  });
}

/** Demo checkout: activate selected plan (no real payment). */
export async function subscribeMembership(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!._id.toString();
  const planId =
    typeof req.body?.planId === "string" ? req.body.planId.trim() : "";

  if (!planId || !mongoose.isValidObjectId(planId)) {
    return sendError(res, "PLAN_REQUIRED", "Select a membership plan to continue.", 400);
  }

  const plan = await MembershipPlan.findOne({ _id: planId, isActive: true });
  if (!plan) {
    return sendError(res, "PLAN_NOT_FOUND", "That membership plan is not available.", 404);
  }

  // Replace any current active plan (switch / renew)
  await Membership.updateMany(
    {
      userId,
      status: MembershipStatus.ACTIVE,
      endDate: { $gte: new Date() },
    },
    { $set: { status: MembershipStatus.CANCELLED, endDate: new Date() } },
  );

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const membership = await Membership.create({
    userId,
    planId: plan._id,
    status: MembershipStatus.ACTIVE,
    startDate,
    endDate,
  });

  return sendData(
    res,
    {
      membership: toPublicMembership(membership, {
        name: plan.name,
        durationDays: plan.durationDays,
      }),
      message: "Membership activated (demo payment).",
    },
    201,
  );
}

export async function cancelMembership(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!._id.toString();
  const membership = await Membership.findOne({
    userId,
    status: MembershipStatus.ACTIVE,
    endDate: { $gte: new Date() },
  }).sort({ endDate: -1 });

  if (!membership) {
    return sendError(
      res,
      "NO_ACTIVE_MEMBERSHIP",
      "No active parking plan to cancel.",
      404,
    );
  }

  membership.status = MembershipStatus.CANCELLED;
  membership.endDate = new Date();
  await membership.save();

  await GuestPass.updateMany(
    { creatorId: userId, status: GuestPassStatus.ACTIVE },
    { $set: { status: GuestPassStatus.REVOKED, revokedAt: new Date() } },
  );

  const plan = await MembershipPlan.findById(membership.planId);

  return sendData(res, {
    membership: toPublicMembership(
      membership,
      plan ? { name: plan.name, durationDays: plan.durationDays } : undefined,
    ),
    message: "Parking plan cancelled. Backup Pass is no longer available.",
  });
}
