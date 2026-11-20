export const DEFAULT_PORT = 5500;

/**
 * Resolve the Five Server baseURL from the `fiveServer.baseURL` setting.
 *
 * - "AUTO" returns "/" on desktop and "/proxy/{port}/" on web (for example code-server).
 * - Any other non-empty value is used as is.
 * - An empty value returns undefined, which means "keep the current baseURL".
 */
export function resolveBaseURL(
  setting: string | undefined,
  appHost: string,
  port: number | undefined,
): string | undefined {
  if (setting !== "AUTO") return setting || undefined;

  if (appHost !== "desktop") return `/proxy/${port ?? DEFAULT_PORT}/`;

  return "/";
}
