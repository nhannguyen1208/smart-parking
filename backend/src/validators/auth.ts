import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    studentId: z.string().trim().min(1).optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.email || data.studentId, {
    message: "Email or student ID is required",
    path: ["email"],
  });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  vehicleNumber: z.string().trim().optional(),
  vehicleType: z.string().trim().optional(),
});
