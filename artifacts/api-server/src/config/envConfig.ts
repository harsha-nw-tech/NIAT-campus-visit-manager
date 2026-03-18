/**
 * Environment Configuration System
 * Supports: gamma, prod environments
 * Set APP_ENV variable to switch between them
 */

export type Environment = "gamma" | "prod";

export interface NiatConfig {
  apiKey: string;
  apiBaseUrl: string;
  applicationUrl: string;
  clientKeyDetailsId: string;
  templateId: string;
  sectionId: string;
  fieldId: string;
  fieldValue: string;
  bookedCampusVisitSectionId: string;
  visitedCampusSectionId: string;
  // Shared constants
  applicationName: string;
  countryCode: string;
  identity: string;
}

export interface AppConfig {
  environment: Environment;
  niat: NiatConfig;
}

export function getEnvironment(): Environment {
  const env = (process.env.APP_ENV || "gamma").toLowerCase();
  if (env === "prod") return "prod";
  return "gamma";
}

const APPLICATION_URLS: Record<Environment, string> = {
  gamma: "https://apply-niat-gamma.earlywave.in/application",
  prod: "https://apply.niatindia.com/application",
};

function getEnvConfig(env: Environment): NiatConfig {
  const prefix = env.toUpperCase();

  // For each key, prefer prefixed (e.g. GAMMA_TEMPLATE_ID) then fall back to unprefixed
  const get = (key: string) =>
    (process.env[`${prefix}_${key}`] || process.env[key] || "").trim();

  return {
    apiKey: get("NIAT_API_KEY"),
    apiBaseUrl: get("NIAT_API_BASE_URL"),
    applicationUrl: APPLICATION_URLS[env],
    clientKeyDetailsId: get("COMMON_DATA_CLIENT_KEY_DETAILS_ID"),
    templateId: get("TEMPLATE_ID"),
    sectionId: get("SECTION_ID"),
    fieldId: get("FIELD_ID"),
    fieldValue: get("FIELD_VALUE"),
    bookedCampusVisitSectionId: get("BOOKED_CAMPUS_VISIT_SECTION_ID"),
    visitedCampusSectionId: get("NIAT_VISITED_CAMPUS_SECTION_ID"),
    applicationName: (process.env.NIAT_APPLICATION_NAME || "NIAT_2026").trim(),
    countryCode: "+91",
    identity: (process.env.NIAT_IDENTITY || "STUDENT").trim(),
  };
}

export function getConfig(): AppConfig {
  const environment = getEnvironment();
  return {
    environment,
    niat: getEnvConfig(environment),
  };
}

export function getNiatConfig(): NiatConfig {
  return getConfig().niat;
}

export function logConfig(): void {
  const { environment, niat } = getConfig();
  console.log(`[ENV] Environment: ${environment}`);
  console.log(`[ENV] API Base URL: ${niat.apiBaseUrl}`);
  console.log(`[ENV] Application URL: ${niat.applicationUrl}`);
  console.log(`[ENV] Application Name: ${niat.applicationName}`);
}
