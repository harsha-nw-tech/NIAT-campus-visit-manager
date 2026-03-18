import { updateTemplateResponse } from "./niatClient.js";
import { getNiatConfig } from "../config/envConfig.js";

interface TemplateConfig {
  templateId: string;
  sectionId: string;
  fieldId: string;
  fieldValue: string;
}

function getTemplateConfig(isNewUser: boolean): TemplateConfig {
  const cfg = getNiatConfig();
  if (isNewUser) {
    return {
      templateId: cfg.newUserTemplateId,
      sectionId:  cfg.newUserSectionId,
      fieldId:    cfg.newUserFieldId,
      fieldValue: cfg.newUserFieldValue,
    };
  }
  return {
    templateId: cfg.existingUserTemplateId,
    sectionId:  cfg.existingUserSectionId,
    fieldId:    cfg.existingUserFieldId,
    fieldValue: cfg.existingUserFieldValue,
  };
}

export async function updateTemplate(
  userId: string,
  applicationId: string,
  isNewUser: boolean,
): Promise<void> {
  const { templateId, sectionId, fieldId, fieldValue } = getTemplateConfig(isNewUser);

  const userType = isNewUser ? "new" : "existing";

  if (!templateId) throw new Error(`TEMPLATE_ID is not configured for ${userType} user`);
  if (!sectionId)  throw new Error(`SECTION_ID is not configured for ${userType} user`);
  if (!fieldId)    throw new Error(`FIELD_ID is not configured for ${userType} user`);
  if (!fieldValue) throw new Error(`FIELD_VALUE is empty for ${userType} user — cannot update template`);

  const payload = {
    user_id:        userId,
    application_id: applicationId,
    template_id:    templateId,
    section_id:     sectionId,
    field_id:       fieldId,
    field_value:    fieldValue,
  };

  console.log(
    `[updateTemplate][${userType}] field: ${fieldId} user: ${userId} app: ${applicationId} value: "${fieldValue}"`,
  );

  await updateTemplateResponse(applicationId, payload);

  console.log(`[updateTemplate][${userType}] field ${fieldId} updated successfully`);
}
