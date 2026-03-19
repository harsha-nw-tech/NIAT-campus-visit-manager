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

  // New user template config (direct visit flow)
  newUserTemplateId: string;
  newUserSectionId: string;
  newUserFieldId: string;
  newUserFieldValue: string;

  // Existing user template config (mark visited flow)
  existingUserTemplateId: string;
  existingUserSectionId: string;
  existingUserFieldId: string;
  existingUserFieldValue: string;

  // Section completion IDs
  bookedCampusVisitSectionId: string;
  officeVisitSectionId: string;

  // Shared
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

  // Looks for GAMMA_KEY first, then KEY, then falls back to fallback string
  const get = (key: string, fallback = "") =>
    (process.env[`${prefix}_${key}`] || process.env[key] || fallback).trim();

  // For keys that have a user-type-specific var with a shared fallback
  const getWithFallback = (specificKey: string, sharedKey: string) =>
    get(specificKey) || get(sharedKey);

  return {
    apiKey: get("NIAT_X_API_KEY"),
    apiBaseUrl: get("NIAT_API_BASE_URL"),
    applicationUrl: APPLICATION_URLS[env],
    clientKeyDetailsId: get("COMMON_DATA_CLIENT_KEY_DETAILS_ID"),

    // New user (direct visit flow)
    newUserTemplateId: get("NEW_USER_TEMPLATE_ID"),
    newUserSectionId: get("NEW_USER_SECTION_ID"),
    newUserFieldId: get("NEW_USER_FIELD_ID"),
    newUserFieldValue: get("NEW_USER_FIELD_VALUE"),

    // Existing user (mark visited flow) — falls back to shared TEMPLATE_ID / SECTION_ID / FIELD_ID
    existingUserTemplateId: getWithFallback(
      "EXISTING_USER_TEMPLATE_ID",
      "TEMPLATE_ID",
    ),
    existingUserSectionId: getWithFallback(
      "EXISTING_USER_SECTION_ID",
      "SECTION_ID",
    ),
    existingUserFieldId: getWithFallback("EXISTING_USER_FIELD_ID", "FIELD_ID"),
    existingUserFieldValue: get("EXISTING_USER_FIELD_VALUE"),

    // Section completion tracking
    bookedCampusVisitSectionId: get("BOOKED_CAMPUS_VISIT_SECTION_ENTITY_ID"),
    officeVisitSectionId: get("NIAT_OFFICE_VISIT_SECTION_ENTITY_ID"),

    // Shared
    applicationName: get("NIAT_APPLICATION_NAME", "NIAT_2026"),
    countryCode: get("COUNTRY_CODE", "+91"),
    identity: get("NIAT_IDENTITY", "STUDENT"),
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
