import type { Result } from "arcscord";
import type { User } from "./codeline.type";
import { anyToError, BaseError, defaultLogger, error, ok } from "arcscord";
import { env } from "../../env/env.util";
import { userSchema } from "./codeline.dto";

export async function getUser(email: string): Promise<Result<User["user"] | null, BaseError>> {
  try {
    const data = await fetch(`${env.CODELINE_ENDPOINT}/api/v1/users/${email}`, {
      headers: {
        Authorization: `Bearer ${env.CODELINE_TOKEN}`,
      },
    }).then(data => data.json());

    if (!data) {
      return ok(null);
    }

    const result = userSchema.safeParse(data);
    if (result.success) {
      if (result.data.user) {
        return ok(result.data.user);
      }
      else {
        return ok(null);
      }
    }
    else {
      return error(
        new BaseError({
          message: "invalid zod schema",
          debugs: {
            zodError: result.error.message,
          },
        }),
      );
    }
  }
  catch (e) {
    return error(
      new BaseError({
        message: "failed to request api",
        debugs: {
          error: anyToError(e).message,
        },
      }),
    );
  }
}

export async function updateUserId(email: string, discordId: string): Promise<void> {
  try {
    await fetch(`${env.CODELINE_ENDPOINT}/api/v1/users/${email}`, {
      headers: {
        Authorization: `Bearer ${env.CODELINE_TOKEN}`,
      },
      method: "PATCH",
      body: JSON.stringify({
        discordId,
      }),
    }).then(res => res.json());
  }
  catch (e) {
    defaultLogger.error(`failed to update user : ${anyToError(e).message}`);
  }
}
