const getConfig = () => ({
  baseUrl: (process.env.GAMMA_NIAT_API_BASE_URL || "").trim(),
  apiKey: (process.env.GAMMA_NIAT_API_KEY || "").trim(),
  clientKeyDetailsId: (process.env.COMMON_DATA_CLIENT_KEY_DETAILS_ID || "").trim(),
});

const getHeaders = (extraHeaders: Record<string, string> = {}) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getConfig().apiKey}`,
  ...extraHeaders,
});

export async function searchUserByPhone(phoneNumber: string) {
  const { baseUrl, apiKey } = getConfig();
  const url = `${baseUrl}/api/nw_application/user/phone_number/application/create/v1/`;
  const headers = getHeaders();
  console.log("[NIAT] POST", url);
  console.log("[NIAT] Auth header:", `Token ${apiKey.slice(0, 6)}...${apiKey.slice(-4)} (length: ${apiKey.length})`);
  console.log("[NIAT] Body:", JSON.stringify({ phone_number: phoneNumber }));
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ phone_number: phoneNumber }),
  });
  const text = await res.text();
  console.log("[NIAT] Response status:", res.status);
  console.log("[NIAT] Response body:", text);
  if (!res.ok) {
    throw new Error(`NIAT API error (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

export async function getSectionsCompletion(userId: string, applicationId: string) {
  const { baseUrl } = getConfig();
  const res = await fetch(
    `${baseUrl}/api/nw_application/applications/user_sections_completion/get/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ user_id: userId, application_id: applicationId }),
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
  sectionKey: string,
  completionValue: number
) {
  const { baseUrl } = getConfig();
  const res = await fetch(
    `${baseUrl}/api/nw_application/application/user_section_completion/create_or_update/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        user_id: userId,
        application_id: applicationId,
        section_key: sectionKey,
        completion_value: completionValue,
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
