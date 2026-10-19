import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v !== "false" && v !== "0"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  CORS_ORIGIN: z.string().min(1),
  MQTT_URL: z.string().default("mqtt://localhost:1883"),
  MQTT_USERNAME: z.string().optional().default(""),
  MQTT_PASSWORD: z.string().optional().default(""),
  MQTT_CLIENT_ID: z.string().default("parkwise-api"),
  MQTT_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  PAYMENT_PROVIDER: z.string().default("mock"),
  LPR_PROVIDER: z.string().default("mock"),
  LMS_PROVIDER: z.string().default("mock"),
  ZALO_ZNS_CONFIGURED: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  FEATURE_GUEST_PASS: z.string().optional().default("true"),
  FEATURE_KILL_SWITCH: z.string().optional().default("true"),
  FEATURE_SOS: z.string().optional().default("true"),
  FEATURE_REWARDS: z.string().optional().default("true"),
  FEATURE_CARPOOL: z.string().optional().default("true"),
  FEATURE_SCHEDULE_PRIORITY: z.string().optional().default("true"),
  ZERO_LOST_NUDGE_MINUTES: z.coerce.number().default(3),
  EARLY_BIRD_CUTOFF: z.string().default("07:00"),
  EARLY_BIRD_POINTS: z.coerce.number().default(10),
  SAMPLE_DAILY_FEE_VND: z.coerce.number().default(10000),
});

export const env = envSchema.parse(process.env);

export function isDemoMode() {
  return Boolean(env.DEMO_MODE) && env.NODE_ENV !== "production";
}
