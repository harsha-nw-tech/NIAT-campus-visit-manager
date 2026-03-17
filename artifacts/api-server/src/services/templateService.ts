import { updateTemplateResponse } from "./niatClient.js";

const TEMPLATE_CONFIG = {
  TEMPLATE_ID: process.env.TEMPLATE_ID || "",
  SECTION_ID: process.env.SECTION_ID || "",
  FIELD_ID: process.env.FIELD_ID || "",
  FIELD_VALUE: "PCM / MPC (Maths)",
};

export async function updateTemplate(applicationId: string): Promise<void> {
  const payload = {
    application_id: applicationId,
    template_id: TEMPLATE_CONFIG.TEMPLATE_ID,
    section_id: TEMPLATE_CONFIG.SECTION_ID,
    field_id: TEMPLATE_CONFIG.FIELD_ID,
    field_value: TEMPLATE_CONFIG.FIELD_VALUE,
  };

  const dataString = `'${JSON.stringify(payload)}'`;
  await updateTemplateResponse(applicationId, dataString);
}
