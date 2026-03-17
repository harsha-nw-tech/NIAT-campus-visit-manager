import { updateTemplateResponse } from "./niatClient.js";
import { getNiatConfig } from "../config/envConfig.js";

const getTemplateConfig = () => {
  const cfg = getNiatConfig();
  return {
    TEMPLATE_ID: cfg.templateId,
    SECTION_ID: cfg.sectionId,
    FIELDS: [
      {
        FIELD_ID: cfg.fieldId,
        FIELD_VALUE: "Studying 12th/Intermediate 2nd Year",
      },
    ],
  };
};

export async function updateTemplate(userId: string, applicationId: string): Promise<void> {
  const { TEMPLATE_ID, SECTION_ID, FIELDS } = getTemplateConfig();

  if (!TEMPLATE_ID) throw new Error("TEMPLATE_ID is not configured");
  if (!SECTION_ID) throw new Error("SECTION_ID is not configured");

  for (const field of FIELDS) {
    if (!field.FIELD_ID) {
      throw new Error("FIELD_ID is not configured — cannot update template");
    }

    const payload = {
      user_id: userId,
      application_id: applicationId,
      template_id: TEMPLATE_ID,
      section_id: SECTION_ID,
      field_id: field.FIELD_ID,
      field_value: field.FIELD_VALUE,
    };

    const dataString = `'${JSON.stringify(payload)}'`;
    console.log(
      `[updateTemplate] Updating field ${field.FIELD_ID} for user ${userId} application ${applicationId}`,
    );
    await updateTemplateResponse(applicationId, dataString);
    console.log(
      `[updateTemplate] Field ${field.FIELD_ID} updated successfully`,
    );
  }
}
