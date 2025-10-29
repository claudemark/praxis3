import { activeSession, sessionHistory } from "@/data/medassist";
import { textTemplates } from "@/data/text-templates";
import { inventoryItems, inventoryMovements } from "@/data/inventory";

export function fetchMedAssistSession() {
  return Promise.resolve({ active: activeSession, history: sessionHistory });
}

export function fetchTextTemplates() {
  return Promise.resolve(textTemplates);
}

export function fetchInventory() {
  return Promise.resolve({ items: inventoryItems, movements: inventoryMovements });
}
