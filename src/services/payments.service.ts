import { eq, desc } from "drizzle-orm";
import { db } from "@/config/database";
import { payments } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { enrollmentsService } from "./enrollments.service";
import type {
  CreatePaymentInput,
  UpdatePaymentStatusInput,
} from "@/validations/payment.schema";

/**
 * Şimdilik gerçek bir ödeme provider'ı entegre edilmedi.
 * Stripe/iyzico geldiğinde:
 * - createIntent: provider'da intent yarat, providerPaymentId'yi kaydet
 * - webhook handler: status'u "completed" yap, enrollment yarat
 */
export const paymentsService = {
  async listByUser(userId: string) {
    return db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  },

  async create(userId: string, input: CreatePaymentInput) {
    const [payment] = await db
      .insert(payments)
      .values({
        userId,
        courseId: input.courseId,
        amount: input.amount.toString(),
        currency: input.currency,
        status: "pending",
      })
      .returning();
    return payment;
  },

  /**
   * Webhook'tan veya admin panelden çağrılır.
   * Tamamlandıysa enrollment yarat.
   */
  async updateStatus(id: string, input: UpdatePaymentStatusInput) {
    const [payment] = await db
      .update(payments)
      .set({
        status: input.status,
        providerPaymentId: input.providerPaymentId,
        paidAt: input.status === "completed" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();

    if (!payment) throw ApiError.notFound("Ödeme bulunamadı");

    if (input.status === "completed") {
      const alreadyEnrolled = await enrollmentsService.isEnrolled(
        payment.userId,
        payment.courseId,
      );
      if (!alreadyEnrolled) {
        await enrollmentsService.enroll(payment.userId, payment.courseId);
      }
    }

    return payment;
  },
};
