import mongoose from "mongoose";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { RewardTransaction } from "../models/RewardTransaction.js";
import { getPointsBalance } from "../services/rewards.service.js";

const studentId = process.argv[2] || "STU-NHI";
const amount = Number(process.argv[3] || 500);

await mongoose.connect(env.MONGODB_URI);
const user = await User.findOne({ studentId });
if (!user) {
  console.error(`User ${studentId} not found`);
  process.exit(1);
}

await RewardTransaction.create({
  userId: user._id,
  points: amount,
  reason: `TEST_GRANT_${Date.now()}`,
  description: `Test points top-up (+${amount})`,
  dayKey: `test-${Date.now()}`,
  kind: "EARN",
});

const bal = await getPointsBalance(user._id.toString());
console.log({ studentId, added: amount, points: bal });
await mongoose.disconnect();
