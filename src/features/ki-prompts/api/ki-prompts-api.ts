import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { KiPrompt } from "@/data/ki-prompts";

const PROMPTS_ENDPOINT = "/ki_prompts";

type KiPromptDbRecord = {
  id: string;
  title: string;
  prompt: string;
  scope: string;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  use_case: string;
  variables: string[] | null;
  author_id: string | null;
  active: boolean;
};

const toAppModel = (db: KiPromptDbRecord): KiPrompt => ({
  id: db.id,
  title: db.title,
  scope: db.scope,
  prompt: db.prompt,
  useCase: db.use_case,
});

const toDbRecord = (prompt: Partial<KiPrompt>): Partial<KiPromptDbRecord> => ({
  id: prompt.id,
  title: prompt.title,
  prompt: prompt.prompt,
  scope: prompt.scope,
  use_case: prompt.useCase,
  active: true,
  updated_at: new Date().toISOString(),
});


export async function fetchKiPromptsFromSupabase(): Promise<KiPrompt[]> {
  console.log("[KI Prompts API] Fetching all prompts, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  
  const records = await supabaseRequest<KiPromptDbRecord[]>(`${PROMPTS_ENDPOINT}?select=*&order=created_at.desc`);
  console.log("[KI Prompts API] Fetched", records.length, "prompts from Supabase");
  return records.map(toAppModel);
}



export async function createKiPromptInSupabase(prompt: KiPrompt): Promise<KiPrompt> {
  console.log("[KI Prompts API] Creating prompt:", prompt.title);
  if (!isSupabaseConfigured) {
    return prompt;
  }
  
  try {
    const [record] = await supabaseRequest<KiPromptDbRecord[]>(PROMPTS_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...toDbRecord(prompt), created_at: new Date().toISOString() }),
    });
    console.log("[KI Prompts API] Prompt created successfully");
    return toAppModel(record);
  } catch (error) {
    console.error("[KI Prompts API] Error creating prompt:", error);
    throw error;
  }
}



export async function updateKiPromptInSupabase(id: string, changes: Partial<KiPrompt>): Promise<KiPrompt | null> {
  console.log("[KI Prompts API] Updating prompt:", id);
  if (!isSupabaseConfigured) {
    return null;
  }
  
  try {
    const [record] = await supabaseRequest<KiPromptDbRecord[]>(`${PROMPTS_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toDbRecord(changes)),
    });
    console.log("[KI Prompts API] Prompt updated successfully");
    return toAppModel(record);
  } catch (error) {
    console.error("[KI Prompts API] Error updating prompt:", error);
    return null;
  }
}



export async function deleteKiPromptFromSupabase(id: string): Promise<void> {
  console.log("[KI Prompts API] Deleting prompt:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${PROMPTS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[KI Prompts API] Prompt deleted successfully");
  } catch (error) {
    console.error("[KI Prompts API] Error deleting prompt:", error);
    throw error;
  }
}

