import type { Response } from "express";
import { Membership, toPublicMembership } from "../models/Membership.js";
import {
  MembershipPlan,
  toPublicPlan,
} from "../models/MembershipPlan.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sendData } from "../utils/apiResponse.js";
import { getActiveMembership } from "../services/dashboard.service.js";

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
  const featuredPlanId = plans.find((plan) => plan.durationDays === 90)?._id.toString();

  return sendData(res, {
    plans: plans.map((plan) => ({
      ...toPublicPlan(plan),
      featured: plan._id.toString() === featuredPlanId,
    })),
  });
}
