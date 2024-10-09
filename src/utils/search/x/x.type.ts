import type { z, ZodSchema } from "zod";

export type GPTFunction<Z extends ZodSchema = ZodSchema> = {
  params: Z;
  name: string;
  description: string;
  run: (params: z.infer<Z>) => Promise<string> | string;
};
