import { SlashCmdBuilder } from "arcscord";

export const adminCommandBuilder = new SlashCmdBuilder()
  .setName("admin")
  .setDescription("Administrator command")
  .setDefaultMemberPermissions("Administrator")
  .setDMPermission(false)
  .addSubcommandGroup(group => group
    .setName("verify")
    .setDescription("verify commands")
    .addSubcommand(sub => sub.setName("setup").setDescription("Setup verif message"))
    .addSubcommand(sub => sub.setName("force").setDescription("Force user verification")));
