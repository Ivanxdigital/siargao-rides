import { z } from "zod";

export const verificationDocumentsSchema = z.object({
  government_id: z.string().url("A valid government ID URL is required"),
  business_permit: z.string().url().optional(),
});

export const CreateReferralSchema = z.object({
  referrer_id: z.string().uuid(),
  shop_id: z.string().uuid(),
});

export const UpdateReferralStatusSchema = z.object({
  status: z.enum(["pending", "completed", "paid"]).optional(),
  payout_amount: z.number().optional(),
  vehicle_added: z.boolean().optional(),
  shop_verified: z.boolean().optional(),
  paid_at: z.string().datetime().optional(),
  payment_reference: z.string().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

export const ReferralIdSchema = z.string().uuid(); 