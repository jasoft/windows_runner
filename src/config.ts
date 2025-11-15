import dotenv from 'dotenv';

dotenv.config();

const parseNumber = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const config = {
  port: parseNumber(process.env.PORT) ?? 3000,
  allowedCommands: process.env.ALLOWED_COMMANDS
    ?.split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0),
  defaultTimeoutMs: parseNumber(process.env.DEFAULT_TIMEOUT_MS),
  maxOutputLength: parseNumber(process.env.MAX_OUTPUT_LENGTH) ?? 200_000,
};
