import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { InventoryItem, InventoryMovement } from "@/data/inventory";

type InventoryItemDbRecord = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  min_quantity: number;
  location?: string | null;
  last_movement: string;
  created_at: string;
  category?: string | null;
  vendor?: string | null;
  unit_cost?: number | null;
  stock?: number | null;
  min_stock?: number | null;
  unit?: string | null;
  lot?: string | null;
  expiry?: string | null;
  status?: string | null;
  weekly_usage?: number | null;
  reserved?: number | null;
  linked_patients?: number | null;
  supplier_email?: string | null;
  supplier_phone?: string | null;
  supplier_notes?: string | null;
  reserved_quantity?: number | null;
};

type InventoryMovementDbRecord = {
  id: string;
  item_id: string;
  type: string;
  quantity: number;
  actor: string;
  note?: string | null;
  timestamp: string;
  movement_type?: string | null;
  amount?: number | null;
  created_at?: string | null;
};

const ITEM_ENDPOINT = "/inventory_items";
const MOVEMENT_ENDPOINT = "/inventory_movements";

const toItemAppModel = (record: InventoryItemDbRecord): InventoryItem => ({
  id: record.id,
  name: record.name,
  category: record.category || "Allgemein",
  vendor: record.vendor || "Unbekannter Lieferant",
  unitCost: Number(record.unit_cost) || 0,
  stock: record.stock || record.quantity || 0,
  minStock: record.min_stock || record.min_quantity || 0,
  unit: record.unit || "Stück",
  location: record.location || "",
  lot: record.lot || "-",
  expiry: record.expiry || new Date().toISOString(),
  status: (record.status as InventoryItem["status"]) || "ok",
  weeklyUsage: Number(record.weekly_usage) || 0,
  reserved: record.reserved_quantity || record.reserved || 0,
  linkedPatients: record.linked_patients || 0,
  supplierEmail: record.supplier_email || "",
  supplierPhone: record.supplier_phone || "",
  supplierNotes: record.supplier_notes || "",
  lastMovement: record.last_movement,
});

const toItemDbRecord = (item: Partial<InventoryItem>): Partial<InventoryItemDbRecord> => ({
  id: item.id,
  sku: item.id || "", // Use ID as SKU fallback
  name: item.name,
  category: item.category,
  vendor: item.vendor,
  unit_cost: item.unitCost,
  stock: item.stock,
  min_stock: item.minStock,
  quantity: item.stock, // Map stock to quantity as well
  min_quantity: item.minStock,
  unit: item.unit,
  location: item.location,
  lot: item.lot,
  expiry: item.expiry,
  status: item.status,
  weekly_usage: item.weeklyUsage,
  reserved_quantity: item.reserved,
  linked_patients: item.linkedPatients,
  supplier_email: item.supplierEmail,
  supplier_phone: item.supplierPhone,
  supplier_notes: item.supplierNotes,
  last_movement: item.lastMovement,
});

const toMovementAppModel = (record: InventoryMovementDbRecord): InventoryMovement => ({
  id: record.id,
  itemId: record.item_id,
  type: record.type as InventoryMovement["type"],
  quantity: record.quantity,
  actor: record.actor,
  note: record.note || "",
  timestamp: record.timestamp,
});

const toMovementDbRecord = (movement: Partial<InventoryMovement>): Partial<InventoryMovementDbRecord> => ({
  id: movement.id,
  item_id: movement.itemId,
  type: movement.type,
  quantity: movement.quantity,
  actor: movement.actor,
  note: movement.note || null,
  timestamp: movement.timestamp,
});

export async function fetchInventoryItemsFromSupabase(): Promise<InventoryItem[]> {
  console.log("[Inventory API] Fetching items, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  const records = await supabaseRequest<InventoryItemDbRecord[]>(`${ITEM_ENDPOINT}?select=*&order=name.asc`);
  console.log("[Inventory API] Fetched", records.length, "items from Supabase");
  return records.map(toItemAppModel);
}

export async function fetchInventoryMovementsFromSupabase(): Promise<InventoryMovement[]> {
  console.log("[Inventory API] Fetching movements, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  const records = await supabaseRequest<InventoryMovementDbRecord[]>(`${MOVEMENT_ENDPOINT}?select=*&order=timestamp.desc`);
  console.log("[Inventory API] Fetched", records.length, "movements from Supabase");
  return records.map(toMovementAppModel);
}

export async function createInventoryItemInSupabase(item: InventoryItem): Promise<InventoryItem> {
  console.log("[Inventory API] Creating item:", item.name);
  if (!isSupabaseConfigured) {
    return item;
  }
  try {
    const [record] = await supabaseRequest<InventoryItemDbRecord[]>(ITEM_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toItemDbRecord(item)),
    });
    console.log("[Inventory API] Item created successfully");
    return toItemAppModel(record);
  } catch (error) {
    console.error("[Inventory API] Error creating item:", error);
    throw error;
  }
}

export async function updateInventoryItemInSupabase(
  id: string,
  changes: Partial<InventoryItem>,
): Promise<InventoryItem | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const payload = toItemDbRecord({ ...changes, id });
  delete payload.id;
  if (Object.keys(payload).length === 0) {
    return null;
  }
  const [record] = await supabaseRequest<InventoryItemDbRecord[]>(
    `${ITEM_ENDPOINT}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    },
  );
  return record ? toItemAppModel(record) : null;
}

export async function deleteInventoryItemInSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }
  await supabaseRequest(`${ITEM_ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
    skipJsonParse: true,
  });
}

export async function createInventoryMovementInSupabase(movement: InventoryMovement): Promise<InventoryMovement> {
  console.log("[Inventory API] Creating movement for item:", movement.itemId);
  if (!isSupabaseConfigured) {
    return movement;
  }
  try {
    const [record] = await supabaseRequest<InventoryMovementDbRecord[]>(MOVEMENT_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toMovementDbRecord(movement)),
    });
    console.log("[Inventory API] Movement created successfully");
    return toMovementAppModel(record);
  } catch (error) {
    console.error("[Inventory API] Error creating movement:", error);
    throw error;
  }
}
