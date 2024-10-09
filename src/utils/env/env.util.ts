import * as process from "node:process";
import { envSchema } from "./env.z";
import "dotenv/config";

const data = envSchema.safeParse(process.env);
if (!data.success) {
  throw data.error;
}
export const env = data.data;
