import { z } from 'zod';

export const envSchema = z.object({
  // TOKENS
  TOKEN: z.string(),
  OPENAI_API_KEY: z.string(),
  GOOGLE_API_KEY: z.string(),
  CODELINE_TOKEN: z.string(),
  CODELINE_WEBHOOK_SECRET: z.string(),

  // URLS
  DATABASE_URL: z.string(),
  CODELINE_ENDPOINT: z.string(),
  ICON_URL: z.string(),
  INVITATION_URL: z.string(),
  WEBHOOK_URL: z.string(),

  // DISCORD GUILD ID
  SERVER_ID: z.string(),

  // DISCORD CATEGORIES IDS
  CREATE_TICKET_CATEGORY_ID: z.string(),
  CLAIMED_TICKET_CATEGORY_ID: z.string(),
  CLOSED_TICKET_CATEGORY_ID: z.string(),

  // DISCORD CHANNELS IDS
  LINKS_CHANNEL_ID: z.string(),
  HELP_CHANNEL_ID: z.string(),
  PRESENTATION_CHANNEL_ID: z.string(),
  WELCOME_CHANNEL_ID: z.string(),
  VERIFICATION_CHANNEL_ID: z.string(),
  CREATE_TICKET_CHANEL_ID: z.string(),

  // DISCORD ROLES IDS
  VERIFY_ROLE_ID: z.string(),
  LYNX_ROLE_ID: z.string(),
  NEXTREACT_ROLE_ID: z.string(),
  BEGINJAVASCRIPT_ROLE_ID: z.string(),
  BEGINREACT_ROLE_ID: z.string(),
  NEXTAILWIND_ROLE_ID: z.string(),
  NEXTAI_ROLE_ID: z.string(),
  NOWTS_ROLE_ID: z.string(),
  NOWTSPRO_ROLE_ID: z.string(),

  // DISCORD TAG ID
  RESOLVED_THREAD_TAG_ID: z.string(),

  // FEATURES
  WELCOME_MESSAGE: z.string(),

  MIN_USERNAME_LEN: z.string(),
  MAX_USERNAME_LEN: z.string(),

  DAY_TO_WARN: z.string(),
  DAY_TO_KICK: z.string(),
});
