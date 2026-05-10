import { z } from "zod";
import { PAYMENT_STATUS } from "@/config/constants";

export const createPaymentSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    amount: z.coerce.number().min(0),
    currency: z.string().length(3).default("TRY"),
  }),
});

export const updatePaymentStatusSchema = z.object({
  body: z.object({
    status: z.enum(PAYMENT_STATUS),
    providerPaymentId: z.string().optional(),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>["body"];
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>["body"];
