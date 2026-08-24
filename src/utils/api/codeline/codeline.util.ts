import type { Result } from "arcscord";
import type { User } from "./codeline.type";
import { anyToError, BaseError, error, ok } from "arcscord";
import { env } from "../../env/env.util";
import { userSchema } from "./codeline.dto";

export async function getUser(email: string): Promise<Result<User["user"] | null, BaseError>> {
  try {
    const response = await fetch(`${env.CODELINE_ENDPOINT}/api/v1/users/${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${env.CODELINE_TOKEN}`,
      },
    });
    if (response.status === 400) {
      const data: unknown = await response.json();
      if (
        typeof data === "object"
        && data !== null
        && !Array.isArray(data)
        && Object.keys(data).length === 2
        && "error" in data
        && data.error === "User not found."
        && "status" in data
        && data.status === 400
      ) {
        return ok(null);
      }
    }
    if (!response.ok) {
      throw new Error(`Codeline request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

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
  const response = await fetch(`${env.CODELINE_ENDPOINT}/api/v1/users/${encodeURIComponent(email)}`, {
    headers: {
      Authorization: `Bearer ${env.CODELINE_TOKEN}`,
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify({
      discordId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Codeline user update failed: ${response.status} ${response.statusText}`);
  }
}
