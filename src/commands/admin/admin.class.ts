import type {
  ArcClient,
  CommandRunContext,
  CommandRunResult,
  InteractionDefaultReplyOptions,
  SlashCmdBuilder,
  SlashCommandWithSubs,
  SubSlashCommandList,
} from "arcscord";
import { Command } from "arcscord";
import { adminCommandBuilder } from "./admin.builder";
import { ForceVerifySubCommand } from "./force/admin_force_verify.class";
import { SetupVerifySubCommand } from "./setup/verify.class";

export class AdminCommand extends Command implements SlashCommandWithSubs {
  name = "admin";

  slashBuilder = adminCommandBuilder as SlashCmdBuilder;

  subsCommands: SubSlashCommandList = {};

  defaultReplyOptions: InteractionDefaultReplyOptions = {
    preReply: true,
    ephemeral: true,
  };

  constructor(client: ArcClient) {
    super(client);

    this.subsCommands = {
      verify: {
        setup: new SetupVerifySubCommand(this.client, this),
        force: new ForceVerifySubCommand(this.client, this),
      },
    };
  }

  async run(ctx: CommandRunContext): Promise<CommandRunResult> {
    return this.handleSubCommands(ctx);
  }
}
