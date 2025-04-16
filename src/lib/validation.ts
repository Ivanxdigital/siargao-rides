import { z } from "zod";

export const verificationDocumentsSchema = z.object({
  government_id: z.string().url("A valid government ID URL is required"),
  business_permit: z.string().url().optional(),
}); 