const getConfig = () => ({
  baseUrl: process.env.GAMMA_NIAT_API_BASE_URL || "",
  apiKey: process.env.GAMMA_NIAT_API_KEY || "",
  clientKeyDetailsId: process.env.COMMON_DATA_CLIENT_KEY_DETAILS_ID || "",
});

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getConfig().apiKey}`,
});

export async function searchUserByPhone(phoneNumber: string) {
  const { baseUrl } = getConfig();
  const res = await fetch(
    `${baseUrl}/api/nw_application/user/phone_number/application/create/v1/`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ phone_number: phoneNumber }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NIAT API error (${res.status}): ${text}`);
  }
  return res.json();
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
