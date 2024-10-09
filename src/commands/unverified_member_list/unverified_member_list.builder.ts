import { SlashCmdBuilder } from "arcscord";

export const unverifiedMemberListBuilder = new SlashCmdBuilder()
  .setName("unverified-member-list")
  .setDescription("The list of the unverified members list")
  .setDMPermission(false)
  .setDefaultMemberPermissions("ManageRoles");
