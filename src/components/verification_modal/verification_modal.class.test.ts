import type { ModalSubmitRunContext } from "arcscord";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedEnv = {
  VERIFY_ROLE_ID: "verify",
  LYNX_ROLE_ID: "lynx",
  CREATE_TICKET_CHANEL_ID: "tickets",
  WELCOME_CHANNEL_ID: "welcome",
  WELCOME_MESSAGE: "Welcome {mention}",
  MIN_USERNAME_LEN: "1",
  MAX_USERNAME_LEN: "32",
  NEXTREACT_ROLE_ID: "nextreact",
  BEGINJAVASCRIPT_ROLE_ID: "beginjavascript",
  BEGINREACT_ROLE_ID: "beginreact",
  NEXTAILWIND_ROLE_ID: "nextailwind",
  NEXTAI_ROLE_ID: "nextai",
  NOWTS_ROLE_ID: "nowts",
  NOWTSPRO_ROLE_ID: "nowtspro",
  BEGINWEB_ROLE_ID: "beginweb",
  NEXTFULLSTACK_ROLE_ID: "nextfullstack",
  AIBUILDER_ROLE_ID: "aibuilder",
  CLAUDECODE_ROLE_ID: "claudecode",
  AIBUILDER_MOBILE_ROLE_ID: "aibuilderMobile",
  NOWSTACK_SAAS_ROLE_ID: "nowstack",
  NOWSTACK_MOBILE_ROLE_ID: "nowstackMobile",
  ASSISTANTPRO_ROLE_ID: "assistantPro",
};

vi.mock("@/utils/env/env.util", () => ({ env: mockedEnv }));
vi.mock("../../utils/env/env.util", () => ({ env: mockedEnv }));

vi.mock("@/utils/api/codeline/codeline.role-mapping", () => ({
  getCodelineRoleIdsForProducts: vi.fn(() => ["static-mapping-role"]),
  getCodelineRoleDelta: vi.fn((
    currentRoleIds: Iterable<string>,
    desiredRoleIds: readonly string[],
    additionalManagedRoleIds: readonly string[] = [],
  ) => {
    const currentRoles = new Set(currentRoleIds);
    const desiredRoles = new Set(desiredRoleIds);
    return {
      roleIdsToAdd: [...desiredRoles].filter(roleId => !currentRoles.has(roleId)),
      roleIdsToRemove: [...currentRoles].filter(
        roleId => ["nowts", "nowtspro", ...additionalManagedRoleIds].includes(roleId)
          && !desiredRoles.has(roleId),
      ),
    };
  }),
}));

vi.mock("@/utils/api/codeline/codeline.role-state", () => ({
  resolveCodelineRoleState: vi.fn(),
}));

const codelineUtilMock = {
  getUser: vi.fn(),
  updateUserId: vi.fn(),
};
vi.mock("@/utils/api/codeline/codeline.util", () => codelineUtilMock);
vi.mock("../../utils/api/codeline/codeline.util", () => codelineUtilMock);

vi.mock("@/utils/messages/message.util", () => ({
  getPresentationMessages: vi.fn(),
}));

vi.mock("@/utils/format/formatUser", () => ({
  displayName: vi.fn(() => "member"),
}));

vi.mock("@/utils/log/log.util", () => ({
  LynxLogger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

const { getUser, updateUserId } = await import("@/utils/api/codeline/codeline.util");
const { getCodelineRoleIdsForProducts } = await import("@/utils/api/codeline/codeline.role-mapping");
const { LynxLogger } = await import("@/utils/log/log.util");
const { resolveCodelineRoleState } = await import("@/utils/api/codeline/codeline.role-state");
const { getPresentationMessages } = await import("@/utils/messages/message.util");
const { VerificationModal } = await import("./verification_modal.class");

function createContext(roleIds = ["unrelated", "verify", "nowtspro"]) {
  const member = {
    roles: {
      cache: new Map(roleIds.map(roleId => [roleId, {}])),
      add: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    setNickname: vi.fn().mockResolvedValue(undefined),
  };
  const interaction = {
    fields: {
      getTextInputValue: vi.fn((customId: string) => customId.includes("email")
        ? "lynx@example.com"
        : "Lynx"),
    },
    user: {
      id: "discord-id",
      toString: () => "<@discord-id>",
    },
    member: {},
    guild: {
      members: {
        fetch: vi.fn().mockResolvedValue(member),
      },
    },
  };

  return {
    ctx: { interaction, defer: true } as unknown as ModalSubmitRunContext,
    member,
  };
}

describe("verification modal role synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUser).mockResolvedValue([{
      discordId: null,
      products: [{ id: "clqn8pmte0001lr54itcjzl59", title: "NOW.TS" }],
    }, null] as never);
    vi.mocked(getPresentationMessages).mockResolvedValue([[
      { author: { id: "discord-id" }, url: "https://discord.test/presentation" },
    ], null] as never);
    vi.mocked(updateUserId).mockResolvedValue(undefined);
    vi.mocked(resolveCodelineRoleState).mockResolvedValue({
      desiredRoleIds: ["nowts"],
      additionalManagedRoleIds: [],
    });
  });

  it("grants the verification role first, synchronizes roles individually, then sends the success reply", async () => {
    const modal = new VerificationModal({} as never);
    const editReply = vi.spyOn(modal, "editReply").mockResolvedValue([true, null] as never);
    const { ctx, member } = createContext();

    await modal.run(ctx);

    expect(updateUserId).toHaveBeenCalledWith("lynx@example.com", "discord-id");
    expect(member.roles.add).toHaveBeenNthCalledWith(1, "lynx");
    expect(member.roles.add).toHaveBeenNthCalledWith(2, "nowts");
    expect(member.roles.add).toHaveBeenCalledTimes(2);
    expect(member.roles.remove).toHaveBeenCalledOnce();
    expect(member.roles.remove).toHaveBeenCalledWith("nowtspro");
    expect(member.roles.add.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(updateUserId).mock.invocationCallOrder[0],
    );
    expect(member.roles.remove.mock.invocationCallOrder[0]).toBeLessThan(
      editReply.mock.invocationCallOrder[0],
    );
  });

  it("still verifies the member when a formation role fails to synchronize", async () => {
    const modal = new VerificationModal({} as never);
    const editReply = vi.spyOn(modal, "editReply").mockResolvedValue([true, null] as never);
    const { ctx, member } = createContext();
    member.roles.remove.mockRejectedValueOnce(new Error("Discord unavailable"));

    const result = await modal.run(ctx);

    expect(result[1]).toBeNull();
    expect(member.roles.add).toHaveBeenCalledTimes(2);
    expect(member.roles.remove).toHaveBeenCalledOnce();
    expect(editReply).toHaveBeenCalled();
    expect(member.setNickname).toHaveBeenCalledWith("Lynx", "Vérification rename");
    expect(LynxLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("failed to synchronize some roles"),
    );
  });

  it("still verifies the member when Codeline linking fails", async () => {
    vi.mocked(updateUserId).mockRejectedValue(new Error("Codeline unavailable"));
    const modal = new VerificationModal({} as never);
    const editReply = vi.spyOn(modal, "editReply").mockResolvedValue([true, null] as never);
    const { ctx, member } = createContext();

    const result = await modal.run(ctx);

    expect(result[1]).toBeNull();
    expect(member.roles.add).toHaveBeenNthCalledWith(1, "lynx");
    expect(member.roles.add).toHaveBeenNthCalledWith(2, "nowts");
    expect(editReply).toHaveBeenCalled();
    expect(LynxLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("failed to link"),
    );
  });

  it("falls back on the static mapping when the database is unreachable", async () => {
    vi.mocked(resolveCodelineRoleState).mockRejectedValue(new Error("Database unreachable"));
    const modal = new VerificationModal({} as never);
    const editReply = vi.spyOn(modal, "editReply").mockResolvedValue([true, null] as never);
    const { ctx, member } = createContext();

    const result = await modal.run(ctx);

    expect(result[1]).toBeNull();
    expect(getCodelineRoleIdsForProducts).toHaveBeenCalledWith([
      "clqn8pmte0001lr54itcjzl59",
    ]);
    expect(member.roles.add).toHaveBeenNthCalledWith(1, "lynx");
    expect(member.roles.add).toHaveBeenNthCalledWith(2, "static-mapping-role");
    expect(editReply).toHaveBeenCalled();
  });

  it("fails only when the verification role itself cannot be granted", async () => {
    const modal = new VerificationModal({} as never);
    const editReply = vi.spyOn(modal, "editReply").mockResolvedValue([true, null] as never);
    const { ctx, member } = createContext();
    member.roles.add.mockRejectedValueOnce(new Error("Missing permissions"));

    const result = await modal.run(ctx);

    expect(result[1]?.message).toContain("failed to add verification role");
    expect(updateUserId).not.toHaveBeenCalled();
    expect(member.roles.add).toHaveBeenCalledOnce();
    expect(editReply).not.toHaveBeenCalled();
  });

  it("grants and reconciles database-only bundle roles from the shared resolver", async () => {
    vi.mocked(resolveCodelineRoleState).mockResolvedValue({
      desiredRoleIds: ["database-bundle-role"],
      additionalManagedRoleIds: ["database-bundle-role", "stale-database-role"],
    });
    const modal = new VerificationModal({} as never);
    vi.spyOn(modal, "editReply").mockResolvedValue([true, null] as never);
    const { ctx, member } = createContext(["lynx", "stale-database-role"]);

    await modal.run(ctx);

    expect(resolveCodelineRoleState).toHaveBeenCalledWith([
      "clqn8pmte0001lr54itcjzl59",
    ]);
    expect(member.roles.add).toHaveBeenCalledWith("database-bundle-role");
    expect(member.roles.remove).toHaveBeenCalledWith("stale-database-role");
  });
});
