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
        FIELD_VALUE: cfg.fieldValue,
      },
    ],
  };
};

export async function updateTemplate(
  userId: string,
  applicationId: string,
  fieldValueOverride?: string,
): Promise<void> {
  const { TEMPLATE_ID, SECTION_ID, FIELDS } = getTemplateConfig();

  if (!TEMPLATE_ID) throw new Error("TEMPLATE_ID is not configured");
  if (!SECTION_ID) throw new Error("SECTION_ID is not configured");

  for (const field of FIELDS) {
    if (!field.FIELD_ID) {
      throw new Error("FIELD_ID is not configured — cannot update template");
    }

    const resolvedValue = fieldValueOverride !== undefined ? fieldValueOverride : field.FIELD_VALUE;

    if (!resolvedValue) {
      throw new Error("FIELD_VALUE is empty — cannot update template");
    }

    const payload = {
      user_id: userId,
      application_id: applicationId,
      template_id: TEMPLATE_ID,
      section_id: SECTION_ID,
      field_id: field.FIELD_ID,
      field_value: resolvedValue,
    };

    console.log(
      `[updateTemplate] Updating field ${field.FIELD_ID} for user ${userId} application ${applicationId} value: "${resolvedValue}"`,
    );
    await updateTemplateResponse(applicationId, payload);
    console.log(
      `[updateTemplate] Field ${field.FIELD_ID} updated successfully`,
    );
  }
}
