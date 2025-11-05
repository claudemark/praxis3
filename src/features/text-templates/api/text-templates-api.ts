import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { TextTemplate } from "@/data/text-templates";

const TEMPLATES_ENDPOINT = "/text_templates";

type TextTemplateDbRecord = {
  id: string;
  name: string;
  category: string;
  content: string;
  variables?: string[] | null;
  tags?: string[] | null;
  active: boolean;
  created_at: string;
  updated_at?: string | null;
};

const toAppModel = (record: TextTemplateDbRecord): TextTemplate => ({
  id: record.id,
  title: record.name,
  category: record.category,
  subCategory: "", // Not in DB
  content: record.content,
  variables: (record.variables || []).map((v) => ({ key: v, label: v, sample: "" })),
  tags: record.tags || [],
  usageCount: 0, // Not tracked in DB
  updatedAt: record.updated_at || record.created_at,
  owner: "System",
  status: record.active ? "freigegeben" : "entwurf",
});

const toDbRecord = (template: Partial<TextTemplate>): Partial<TextTemplateDbRecord> => {
  const dbRecord: Partial<TextTemplateDbRecord> = {
    id: template.id,
    name: template.title,
    category: template.category,
    content: template.content,
    variables: template.variables?.map((v) => v.key) || null,
    tags: template.tags || null,
    active: template.status ? template.status === "freigegeben" : true,
    updated_at: new Date().toISOString(),
  };
  
  console.log("[Text Templates API] Mapping app model to DB record:", { template, dbRecord });
  return dbRecord;
};

export async function fetchTextTemplatesFromSupabase(): Promise<TextTemplate[]> {
  console.log("[Text Templates API] Fetching templates, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    console.warn("[Text Templates API] Supabase not configured, returning empty array");
    return [];
  }
  try {
    const records = await supabaseRequest<TextTemplateDbRecord[]>(`${TEMPLATES_ENDPOINT}?select=*&order=created_at.desc`);
    console.log("[Text Templates API] Raw records from Supabase:", records);
    console.log("[Text Templates API] Fetched", records.length, "templates from Supabase");
    const templates = records.map(toAppModel);
    console.log("[Text Templates API] Mapped templates:", templates);
    return templates;
  } catch (error) {
    console.error("[Text Templates API] Error fetching templates:", error);
    throw error;
  }
}

export async function createTextTemplateInSupabase(template: TextTemplate): Promise<TextTemplate> {
  console.log("[Text Templates API] Creating template:", template.title);
  if (!isSupabaseConfigured) {
    return template;
  }
  try {
    const dbRecord = {
      ...toDbRecord(template),
      created_at: new Date().toISOString(),
    };
    console.log("[Text Templates API] DB record to create:", dbRecord);
    
    const [record] = await supabaseRequest<TextTemplateDbRecord[]>(TEMPLATES_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(dbRecord),
    });
    console.log("[Text Templates API] Template created successfully:", record);
    return toAppModel(record);
  } catch (error) {
    console.error("[Text Templates API] Error creating template:", error);
    throw error;
  }
}

export async function updateTextTemplateInSupabase(id: string, changes: Partial<TextTemplate>): Promise<TextTemplate | null> {
  console.log("[Text Templates API] Updating template:", id);
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    const [record] = await supabaseRequest<TextTemplateDbRecord[]>(`${TEMPLATES_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toDbRecord(changes)),
    });
    console.log("[Text Templates API] Template updated successfully");
    return toAppModel(record);
  } catch (error) {
    console.error("[Text Templates API] Error updating template:", error);
    return null;
  }
}

export async function deleteTextTemplateFromSupabase(id: string): Promise<void> {
  console.log("[Text Templates API] Deleting template:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  try {
    await supabaseRequest(`${TEMPLATES_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Text Templates API] Template deleted successfully");
  } catch (error) {
    console.error("[Text Templates API] Error deleting template:", error);
    throw error;
  }
}
