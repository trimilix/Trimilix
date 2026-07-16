import { z } from "zod";

const secureUrl = z
  .string()
  .trim()
  .min(1)
  .url()
  .refine(value => value.startsWith("https://") || value.startsWith("http://localhost"), {
    message: "must use HTTPS (localhost HTTP is allowed for development)",
  });

const runtimeEnvironmentSchema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  JWT_SECRET: z.string().trim().min(1),
  VITE_APP_ID: z.string().trim().min(1),
  OAUTH_SERVER_URL: secureUrl,
  BUILT_IN_FORGE_API_URL: secureUrl,
  BUILT_IN_FORGE_API_KEY: z.string().trim().min(1),
});

export type CriticalRuntimeEnvironment = z.infer<typeof runtimeEnvironmentSchema>;

export function validateCriticalRuntimeEnvironment(
  input: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): CriticalRuntimeEnvironment {
  const result = runtimeEnvironmentSchema.safeParse(input);
  if (result.success) return result.data;

  const invalidFields = Array.from(
    new Set(result.error.issues.map(issue => issue.path.join(".") || "environment")),
  ).sort();

  throw new Error(
    `Invalid runtime configuration. Check required fields: ${invalidFields.join(", ")}`,
  );
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
