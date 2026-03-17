const getConfig = () => ({
  baseUrl: (process.env.GAMMA_NIAT_API_BASE_URL || "").trim(),
  apiKey: (process.env.GAMMA_NIAT_API_KEY || "").trim(),
  clientKeyDetailsId: (process.env.COMMON_DATA_CLIENT_KEY_DETAILS_ID || "").trim(),
});

const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": getConfig().apiKey,
});

export async function searchUserByPhone(phoneNumber: string) {
  const { baseUrl } = getConfig();
  const res = await fetch(
    `${baseUrl}/api/nw_application/user/phone_number/application/create/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        phone_number: phoneNumber,
        country_code: "91",
        application_details: {
          application_name_enum: process.env.NIAT_APPLICATION_NAME || "NIAT",
          identity: process.env.NIAT_IDENTITY || "NIAT",
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

export async function getSectionsCompletion(userId: string, applicationId: string, accessToken?: string) {
  const { baseUrl, clientKeyDetailsId } = getConfig();

  const bookedSectionId = process.env.BOOKED_CAMPUS_VISIT_SECTION_ID || "";
  const visitedSectionId = process.env.VISITED_CAMPUS_SECTION_ID || "";
  const applicationName = process.env.NIAT_APPLICATION_NAME || "NIAT";

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
  const { baseUrl, clientKeyDetailsId } = getConfig();
  const applicationName = process.env.NIAT_APPLICATION_NAME || "NIAT";

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
      body: JSON.stringify({
        clientKeyDetailsId,
        data,
      }),
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
