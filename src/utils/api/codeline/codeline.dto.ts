import { z } from "zod";

export const userSchema = z.object({
  user: z
    .object({
      discordId: z.string().optional().nullable(),
      products: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
        }),
      ),
    })
    .optional()
    .nullable(),
});
