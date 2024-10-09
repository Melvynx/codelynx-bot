import { MessageCommandBuilder } from "arcscord";

export const solutionMessageBuilder = new MessageCommandBuilder()
  .setName("Marquer comme solution")
  .setDMPermission(false);
