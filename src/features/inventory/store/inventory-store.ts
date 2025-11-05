import { create } from "zustand";
import {
  inventoryItems as initialItems,
  inventoryMovements as initialMovements,
  type InventoryItem,
  type InventoryMovement,
} from "@/data/inventory";
import {
  fetchInventoryItemsFromSupabase,
  fetchInventoryMovementsFromSupabase,
  createInventoryItemInSupabase,
  updateInventoryItemInSupabase,
  deleteInventoryItemInSupabase,
  createInventoryMovementInSupabase,
} from "@/features/inventory/api/inventory-api";
import { isSupabaseConfigured } from "@/services/supabase-client";

const generateInventoryId = () => "INV-" + Date.now();
const generateMovementId = () => "MOV-" + Date.now() + "-" + Math.round(Math.random() * 999);

type CreateItemPayload = Omit<InventoryItem, "id" | "lastMovement"> & {
  id?: string;
  lastMovement?: string;
};

export type MovementPayload = Omit<InventoryMovement, "id" | "timestamp"> & { timestamp?: string };

interface InventoryState {
  items: InventoryItem[];
  movements: InventoryMovement[];
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  fetchInventory: () => Promise<void>;
  createItem: (payload: CreateItemPayload) => InventoryItem;
  updateItem: (id: string, changes: Partial<Omit<InventoryItem, "id">>) => void;
  deleteItem: (id: string) => void;
  logMovement: (payload: MovementPayload) => InventoryMovement;
  deleteMovement: (id: string) => void;
  adjustStock: (opts: { itemId: string; quantity: number; actor: string; note: string }) => InventoryMovement | null;
}

export const useInventoryStore = create<InventoryState>((set, get) => {
  const persistItemCreate = async (item: InventoryItem) => {
    try {
      const saved = await createInventoryItemInSupabase(item);
      if (saved) {
        set((state) => ({
          items: state.items.map((i) => (i.id === item.id ? saved : i)),
        }));
      }
    } catch (error) {
      console.error("[Inventory Store] Failed to persist item", error);
    }
  };

  const persistItemUpdate = async (id: string, changes: Partial<InventoryItem>) => {
    try {
      const saved = await updateInventoryItemInSupabase(id, changes);
      if (saved) {
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? saved : i)),
        }));
      }
    } catch (error) {
      console.error("[Inventory Store] Failed to update item", error);
    }
  };

  const persistItemDelete = async (id: string) => {
    try {
      await deleteInventoryItemInSupabase(id);
    } catch (error) {
      console.error("[Inventory Store] Failed to delete item", error);
    }
  };

  const persistMovementCreate = async (movement: InventoryMovement) => {
    try {
      const saved = await createInventoryMovementInSupabase(movement);
      if (saved) {
        set((state) => ({
          movements: state.movements.map((m) => (m.id === movement.id ? saved : m)),
        }));
      }
    } catch (error) {
      console.error("[Inventory Store] Failed to persist movement", error);
    }
  };

  return {
    items: initialItems,
    movements: initialMovements,
    isLoading: false,
    error: null,
    initialized: false,
    fetchInventory: async () => {
      console.log("[Inventory Store] fetchInventory called, configured:", isSupabaseConfigured);
      if (!isSupabaseConfigured) {
        set({ initialized: true });
        return;
      }
      set({ isLoading: true, error: null });
      try {
        const [items, movements] = await Promise.all([
          fetchInventoryItemsFromSupabase(),
          fetchInventoryMovementsFromSupabase(),
        ]);
        console.log("[Inventory Store] Loaded", items.length, "items and", movements.length, "movements");
        set({ items, movements, isLoading: false, initialized: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Inventory Store] Failed to load from Supabase", error);
        set({ isLoading: false, initialized: true, error: message });
      }
    },
    createItem: (payload) => {
      const timestamp = payload.lastMovement ?? new Date().toISOString();
      const item: InventoryItem = {
        ...payload,
        id: payload.id ?? generateInventoryId(),
        lastMovement: timestamp,
      };
      set((state) => ({ items: [item, ...state.items] }));
      void persistItemCreate(item);
      return item;
    },
    updateItem: (id, changes) => {
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
      }));
      void persistItemUpdate(id, changes);
    },
    deleteItem: (id) => {
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        movements: state.movements.filter((movement) => movement.itemId !== id),
      }));
      void persistItemDelete(id);
    },
    logMovement: ({ itemId, type, quantity, actor, note, timestamp }) => {
      const movement: InventoryMovement = {
        id: generateMovementId(),
        itemId,
        type,
        quantity,
        actor,
        note: note ?? "",
        timestamp: timestamp ?? new Date().toISOString(),
      };
      set((state) => ({
        movements: [movement, ...state.movements],
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, lastMovement: movement.timestamp } : item,
        ),
      }));
      void persistMovementCreate(movement);
      return movement;
    },
    deleteMovement: (movementId) =>
      set((state) => ({
        movements: state.movements.filter((movement) => movement.id !== movementId),
      })),
    adjustStock: ({ itemId, quantity, actor, note }) => {
      const item = get().items.find((entry) => entry.id === itemId);
      if (!item) {
        return null;
      }
      const type: InventoryMovement["type"] = quantity > 0 ? "ein" : quantity < 0 ? "aus" : "anpassung";
      const movement = get().logMovement({ itemId, type, quantity, actor, note });
      set((state) => ({
        items: state.items.map((entry) =>
          entry.id === itemId
            ? {
                ...entry,
                stock: Math.max(0, entry.stock + quantity),
                lastMovement: movement.timestamp,
              }
            : entry,
        ),
      }));
      return movement;
    },
  };
});

export function selectInventoryMetrics(items: InventoryItem[]) {
  const lowStock = items.filter((item) => item.stock <= item.minStock).length;
  const criticalImplants = items.filter((item) => item.status === "critical").length;
  const avgWeeklyConsumption = Math.round(
    items.reduce((acc, item) => acc + item.weeklyUsage, 0) / Math.max(1, items.length),
  );
  const pendingOrders = items.filter((item) => item.status === "low" || item.status === "critical").length;
  return { lowStock, criticalImplants, avgWeeklyConsumption, pendingOrders };
}
