import { z } from "zod";

export const purchasePayloadSchema = z.object({
  type: z.literal('purchase'),
  data: z.object({
    userId: z.string(),
    userDiscordId: z.string().optional(),
    email: z.string().email(),
    createdAt: z.string().datetime(),
    amount: z.number().positive(),
    currency: z.string(),
    // Item can be a product or a bundle
    itemId: z.string(),
    itemSlug: z.string().optional(),
    itemTitle: z.string(),
    itemType: z.enum(['product', 'bundle']),
    ip: z.string().ip(),
    userAgent: z.string(),
  }),
});

export const refundPayloadSchema = z.object({
  type: z.literal('refund'),
  data: z.object({
    userId: z.string(),
    userDiscordId: z.string().optional(),
    email: z.string().email(),
    createdAt: z.string().datetime(),
    amount: z.number().positive(),
    currency: z.string(),
    itemId: z.string(),
    itemSlug: z.string().optional(),
    itemTitle: z.string(),
    itemType: z.enum(['product', 'bundle']),
  }),
});

export const webhookPayloadSchema = z.object({
  type: z.literal('purchase'),
  secret: z.string(),
  data: purchasePayloadSchema,
}).or(z.object({
  type: z.literal('refund'),
  secret: z.string(),
  data: refundPayloadSchema,
}).or(z.object({
  type: z.string(),
  secret: z.string(),
  data: z.any(),
})));
