import type { GuildMember } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTicketsChannels: vi.fn(),
  getUnverifiedMembers: vi.fn(),
  isUserHaveTicket: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/utils/chanels/chanels.utils", () => ({
  getTicketsChannels: mocks.getTicketsChannels,
}));

vi.mock("@/utils/env/env.util", () => ({
  env: {
    DAY_TO_WARN: "3",
    DAY_TO_KICK: "7",
    SERVER_ID: "server",
    VERIFICATION_CHANNEL_ID: "verification",
    PRESENTATION_CHANNEL_ID: "presentation",
    CREATE_TICKET_CHANEL_ID: "tickets",
    ICON_URL: "https://example.com/icon.png",
    INVITATION_URL: "https://example.com/invite",
  },
}));

vi.mock("@/utils/format/formatUser", () => ({
  displayName: vi.fn((member: GuildMember) => `<@${member.id}>`),
}));

vi.mock("@/utils/log/log.util", () => ({
  LynxLogger: {
    info: mocks.info,
    warn: mocks.warn,
  },
}));

vi.mock("./verification_remember.helper", () => ({
  getUnverifiedMembers: mocks.getUnverifiedMembers,
  isUserHaveTicket: mocks.isUserHaveTicket,
}));

const { VerificationRememberTask } = await import("./verification_remember.task");

function createMember(id: string, joinedDaysAgo: number) {
  const joinedTimestamp = Date.now() - joinedDaysAgo * 24 * 60 * 60 * 1000;

  return {
    id,
    joinedAt: new Date(joinedTimestamp),
    joinedTimestamp,
    send: vi.fn().mockResolvedValue(undefined),
    kick: vi.fn().mockResolvedValue(undefined),
    user: {
      id,
      username: id,
    },
  } as unknown as GuildMember;
}

describe("verification reminder task", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTicketsChannels.mockResolvedValue([]);
    mocks.isUserHaveTicket.mockReturnValue(false);
  });

  it("escalates overdue members for manual review without messaging or kicking them", async () => {
    const overdueMember = createMember("overdue", 10);
    mocks.getUnverifiedMembers.mockResolvedValue([[overdueMember], null]);

    const task = new VerificationRememberTask({} as never);
    await task.run();

    expect(overdueMember.send).not.toHaveBeenCalled();
    expect(overdueMember.kick).not.toHaveBeenCalled();
    expect(mocks.warn).toHaveBeenCalledWith(expect.stringContaining("<@overdue>"));
  });

  it("keeps the friendly direct reminder for recently overdue members", async () => {
    const memberToWarn = createMember("warning", 5);
    mocks.getUnverifiedMembers.mockResolvedValue([[memberToWarn], null]);

    const task = new VerificationRememberTask({} as never);
    await task.run();

    expect(memberToWarn.send).toHaveBeenCalledOnce();
    expect(JSON.stringify(vi.mocked(memberToWarn.send).mock.calls[0][0])).not.toMatch(/expuls/i);
    expect(memberToWarn.kick).not.toHaveBeenCalled();
    expect(mocks.warn).not.toHaveBeenCalled();
  });

  it("does not escalate members who already have an open support ticket", async () => {
    const supportedMember = createMember("supported", 10);
    mocks.getUnverifiedMembers.mockResolvedValue([[supportedMember], null]);
    mocks.isUserHaveTicket.mockReturnValue(true);

    const task = new VerificationRememberTask({} as never);
    await task.run();

    expect(supportedMember.send).not.toHaveBeenCalled();
    expect(supportedMember.kick).not.toHaveBeenCalled();
    expect(mocks.warn).not.toHaveBeenCalled();
  });
});
