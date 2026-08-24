import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../env/env.util", () => ({
  env: {
    CODELINE_ENDPOINT: "https://codeline.test",
    CODELINE_TOKEN: "secret",
  },
}));

const { getUser, updateUserId } = await import("./codeline.util");

const emailWithPathCharacters = "lynx+discord/test@example.com";
const encodedEmail = "lynx%2Bdiscord%2Ftest%40example.com";

describe("codeline user URL", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("url-encodes the email when getting a user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ user: null }));
    vi.stubGlobal("fetch", fetchMock);

    await getUser(emailWithPathCharacters);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://codeline.test/api/v1/users/${encodedEmail}`,
      expect.any(Object),
    );
  });

  it("url-encodes the email when updating a user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await updateUserId(emailWithPathCharacters, "discord-id");

    expect(fetchMock).toHaveBeenCalledWith(
      `https://codeline.test/api/v1/users/${encodedEmail}`,
      expect.any(Object),
    );
  });
});

describe("getUser", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns no user when Codeline responds with its not-found status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      error: "User not found.",
      status: 400,
    }, {
      status: 400,
      statusText: "Bad Request",
    })));

    await expect(getUser("unknown@example.com")).resolves.toEqual([null, null]);
  });

  it("returns an error for a different Codeline 400 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      error: "Invalid filter.",
      status: 400,
    }, { status: 400, statusText: "Bad Request" })));

    const [user, err] = await getUser("lynx@example.com");

    expect(user).toBeNull();
    expect(err).not.toBeNull();
  });

  it("returns an error for a malformed Codeline 400 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not json", {
      status: 400,
      statusText: "Bad Request",
    })));

    const [user, err] = await getUser("lynx@example.com");

    expect(user).toBeNull();
    expect(err).not.toBeNull();
  });

  it.each([401, 429, 500])("returns an error when Codeline responds with %i", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));

    const [user, err] = await getUser("lynx@example.com");

    expect(user).toBeNull();
    expect(err).not.toBeNull();
  });
});

describe("updateUserId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects when Codeline returns a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", {
      status: 500,
      statusText: "Internal Server Error",
    })));

    await expect(updateUserId("lynx@example.com", "discord-id")).rejects.toThrow(
      "500 Internal Server Error",
    );
  });
});
