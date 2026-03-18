import { getNiatConfig } from "../config/envConfig.js";

const getConfig = () => {
  const cfg = getNiatConfig();
  return {
    baseUrl: cfg.apiBaseUrl,
    apiKey: cfg.apiKey,
    clientKeyDetailsId: cfg.clientKeyDetailsId,
    applicationName: cfg.applicationName,
    identity: cfg.identity,
    countryCode: cfg.countryCode,
    applicationUrl: cfg.applicationUrl,
  };
};

const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": getConfig().apiKey,
});

export async function searchUserByPhone(phoneNumber: string) {
  const { baseUrl, applicationName, identity, countryCode } = getConfig();

  const body = {
    phone_number: phoneNumber,
    country_code: countryCode,
    application_details: {
      application_name_enum: applicationName,
      identity: identity,
      metadata: JSON.stringify({
        application_type: "OFFLINE_EXAM_SUBMISSION",
      }),
    },
  };

  console.log("[searchUserByPhone] request body:", JSON.stringify(body));

  const res = await fetch(
    `${baseUrl}/api/nw_application/user/phone_number/application/create/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[searchUserByPhone] error ${res.status}:`, text);
    throw new Error(`NIAT API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  console.log("[searchUserByPhone] response:", JSON.stringify(data));
  return data;
}

export async function getUserProfile(userId: string): Promise<{
  userId: string | null;
  name: string | null;
  mobile: string | null;
  language: string | null;
}> {
  const { baseUrl } = getConfig();

  const query = `
    query GetUserName($userId: String) {
      user_profile_details(user_id: $userId) {
        success_response {
          user_id
          name
          phone_number
          preferred_languages
        }
      }
    }
  `;

  try {
    const res = await fetch(`${baseUrl}/graphql/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ query, variables: { userId } }),
    });

    if (!res.ok) {
      console.warn(`[getUserProfile] HTTP ${res.status}`);
      return { userId: null, name: null, mobile: null, language: null };
    }

    const json = await res.json();
    console.log("[getUserProfile] raw:", JSON.stringify(json));

    // Response shape: { data: { user_profile_details: { success_response: { ... } } } }
    const profile = json?.data?.user_profile_details?.success_response;
    console.log("[getUserProfile] parsed profile:", JSON.stringify(profile));

    const rawLang = profile?.preferred_languages;
    const language = Array.isArray(rawLang)
      ? rawLang[0] || null
      : rawLang || null;

    const name =
      profile?.name && profile.name.trim() !== "" ? profile.name : null;
    const mobile = profile?.phone_number || null;
    const canonicalUserId = profile?.user_id || null;

    console.log(
      "[getUserProfile] result → userId:",
      canonicalUserId,
      "name:",
      name,
      "mobile:",
      mobile,
      "language:",
      language,
    );
    return { userId: canonicalUserId, name, mobile, language };
  } catch (err) {
    console.warn("[getUserProfile] error:", err);
    return { userId: null, name: null, mobile: null, language: null };
  }
}

export async function getSectionsCompletion(
  userId: string,
  applicationId: string,
) {
  const {
    baseUrl,
    clientKeyDetailsId,
    bookedCampusVisitSectionId: bookedSectionId,
    visitedCampusSectionId: visitedSectionId,
    applicationName,
  } = getConfig();
  const personalSectionId = process.env.PERSONAL_DETAILS_SECTION_ID;

  const sectionIds = [
    personalSectionId,
    bookedSectionId,
    visitedSectionId,
  ].filter(Boolean);

  const dataPayload = JSON.stringify({
    user_id: userId,
    application_name_enum: applicationName,
    section_entity_config_ids: sectionIds,
  });

  console.log(
    "[getSectionsCompletion] userId:",
    userId,
    "sections:",
    sectionIds,
  );

  const res = await fetch(
    `${baseUrl}/api/nw_application/user/application/sections_completion/get/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        clientKeyDetailsId,
        data: `'${dataPayload}'`,
      }),
    },
  );
  console.log(
    "[getSectionsCompletion] api:",
    `${baseUrl}/api/nw_application/user/application/sections_completion/get/v1/`,
  );
  const text = await res.text();
  console.log(`[getSectionsCompletion] status ${res.status}:`, text);

  if (!res.ok) {
    throw new Error(`NIAT API error (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

export async function updateSectionCompletion(
  userId: string,
  applicationId: string,
  sectionEntityConfigId: string,
  completionValue: number,
) {
  const { baseUrl, applicationName } = getConfig();

  const body = {
    user_id: userId,
    application_name_enum: applicationName,
    section_details: [
      {
        section_entity_config_id: sectionEntityConfigId,
        completion_percentage: completionValue,
      },
    ],
  };

  console.log(
    "[updateSectionCompletion] sectionId:",
    sectionEntityConfigId,
    "value:",
    completionValue,
    "userId:",
    userId,
    "body:",
    JSON.stringify(body),
  );

  const res = await fetch(
    `${baseUrl}/api/nw_application/application/section_completion/create_or_update/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    },
  );

  const text = await res.text();
  console.log(`[updateSectionCompletion] status ${res.status}:`, text);

  if (!res.ok) {
    throw new Error(`NIAT API error (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

export async function updateTemplateResponse(
  applicationId: string,
  data: object,
) {
  const { baseUrl, clientKeyDetailsId } = getConfig();

  console.log(
    "[updateTemplateResponse] applicationId:",
    applicationId,
    "data:",
    data,
  );

  const res = await fetch(
    `${baseUrl}/api/nw_application/application/user/template_response/update/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        clientKeyDetailsId,
        data,
      }),
    },
  );

  const text = await res.text();
  console.log(`[updateTemplateResponse] status ${res.status}:`, text);
  console.log(
    `[updateTemplateResponse] api:`,
    `${baseUrl}/api/nw_application/application/user/template_response/update/v1/`,
  );
  if (!res.ok) {
    throw new Error(`Template API error (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

export async function generateDirectLink(
  userId: string,
  applicationId: string,
) {
  const { applicationUrl } = getConfig();
  console.log("[generateDirectLink] url:", applicationUrl);
  return { redirectUrl: applicationUrl };
}
