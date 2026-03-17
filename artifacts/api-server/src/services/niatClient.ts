const getConfig = () => ({
  baseUrl: (process.env.GAMMA_NIAT_API_BASE_URL || "").trim(),
  apiKey: (process.env.GAMMA_NIAT_API_KEY || "").trim(),
  clientKeyDetailsId: (process.env.COMMON_DATA_CLIENT_KEY_DETAILS_ID || "").trim(),
  applicationName: (process.env.NIAT_APPLICATION_NAME || "").trim(),
  identity: (process.env.NIAT_IDENTITY || "").trim(),
});

const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": getConfig().apiKey,
});

/**
 * STEP 1: Create or find user by phone number.
 * Returns user_id and application_id from NIAT.
 * Note: This always succeeds (creates a new user if not found).
 */
export async function createUserByPhone(
  phoneNumber: string
): Promise<{ user_id: string; application_id: string }> {
  const { baseUrl, applicationName, identity } = getConfig();

  const res = await fetch(
    `${baseUrl}/api/nw_application/user/phone_number/application/create/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        phone_number: phoneNumber,
        country_code: "91",
        application_details: {
          application_name_enum: applicationName,
          identity,
          metadata: JSON.stringify({ application_type: "OFFLINE_EXAM_SUBMISSION" }),
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NIAT API error (${res.status}): ${text}`);
  }
  return res.json();
}

// backwards-compat alias
export const searchUserByPhone = createUserByPhone;

/**
 * STEP 2: Fetch user profile via GraphQL.
 * Returns the canonical user_id (matches gamma panel), name, mobile, and language.
 * A null/empty name means the user is new (never completed their profile).
 */
export async function getUserProfile(userId: string): Promise<{
  userId: string | null;
  name: string | null;
  mobile: string | null;
  language: string | null;
}> {
  const { baseUrl } = getConfig();

  const query = `
    query GetUserProfile($userId: String) {
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

    const data = await res.json();
    console.log("[getUserProfile] raw:", JSON.stringify(data));
    const profile = data?.data?.user_profile_details?.success_response;

    if (!profile) return { userId: null, name: null, mobile: null, language: null };

    const rawLang = profile.preferred_languages;
    const language = Array.isArray(rawLang)
      ? (rawLang[0] || null)
      : (rawLang || null);

    return {
      userId: profile.user_id || null,
      name: profile.name || null,
      mobile: profile.phone_number || null,
      language,
    };
  } catch (err) {
    console.warn("[getUserProfile] error:", err);
    return { userId: null, name: null, mobile: null, language: null };
  }
}

export async function getSectionsCompletion(userId: string, applicationId: string, accessToken?: string) {
  const { baseUrl, clientKeyDetailsId, applicationName } = getConfig();

  const bookedSectionId = process.env.BOOKED_CAMPUS_VISIT_SECTION_ID;
  const visitedSectionId = process.env.VISITED_CAMPUS_SECTION_ID;

  const dataPayload = JSON.stringify({
    user_id: userId,
    application_name_enum: applicationName,
    section_entity_config_ids: [bookedSectionId, visitedSectionId].filter(Boolean),
  });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  } else {
    headers["x-api-key"] = getConfig().apiKey;
  }

  const res = await fetch(
    `${baseUrl}/api/nw_application/applications/user_sections_completion/get/v1/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        clientKeyDetailsId,
        data: `'${dataPayload}'`,
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NIAT API error (${res.status}): ${text}`);
  }
  return res.json();
}

export async function updateSectionCompletion(
  userId: string,
  applicationId: string,
  sectionEntityConfigId: string,
  completionValue: number
) {
  const { baseUrl, clientKeyDetailsId, applicationName } = getConfig();

  const dataPayload = JSON.stringify({
    user_id: userId,
    application_name_enum: applicationName,
    section_entity_config_id: sectionEntityConfigId,
    completion_value: completionValue,
  });

  const res = await fetch(
    `${baseUrl}/api/nw_application/application/user_section_completion/create_or_update/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        clientKeyDetailsId,
        data: `'${dataPayload}'`,
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NIAT API error (${res.status}): ${text}`);
  }
  return res.json();
}

export async function updateTemplateResponse(applicationId: string, data: string) {
  const { baseUrl, clientKeyDetailsId } = getConfig();
  const res = await fetch(
    `${baseUrl}/api/nw_application/application/template_response/update/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ clientKeyDetailsId, data }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Template API error (${res.status}): ${text}`);
  }
  return res.json();
}

export async function generateDirectLink(userId: string, applicationId: string) {
  const { baseUrl } = getConfig();
  const redirectUrl = `${baseUrl}/apply?user_id=${userId}&application_id=${applicationId}`;
  return { redirectUrl };
}
