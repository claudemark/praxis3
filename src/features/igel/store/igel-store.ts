import { create } from "zustand";

import {
  igelServices,
  initialIgelTransactions,
  type IgelService,
  type IgelTransaction,
  type PaymentMethod,
} from "@/data/igel";
import { useInventoryStore } from "@/features/inventory/store/inventory-store";
import { useCashDrawerStore } from "@/features/cash-drawer/store/cash-drawer-store";
import { useEmployeeDirectory } from "@/features/employees/store/employee-store";

interface RecordSalePayload {
  patient: string;
  serviceId: string;
  paymentMethod: PaymentMethod;
  collector: string;
  notes?: string;
}

type CreateServicePayload = Omit<IgelService, "id"> & { id?: string };

type UpdateServicePayload = Partial<Omit<IgelService, "id" | "materials">> & {
  materials?: IgelService["materials"];
};

type UpdateTransactionPayload = Partial<Omit<IgelTransaction, "id" | "amount" | "serviceId">> & {
  amount?: number;
  serviceId?: string;
};

interface IgelState {
  services: IgelService[];
  transactions: IgelTransaction[];
  createService: (payload: CreateServicePayload) => IgelService;
  updateService: (id: string, changes: UpdateServicePayload) => void;
  deleteService: (id: string) => void;
  recordSale: (payload: RecordSalePayload) => IgelTransaction | null;
  updateTransaction: (id: string, changes: UpdateTransactionPayload) => void;
  deleteTransaction: (id: string) => void;
}

const generateServiceId = () => "igel-" + Date.now();
const generateTransactionId = () => "IGEL-" + Date.now() + "-" + Math.round(Math.random() * 999);

export const useIgelStore = create<IgelState>((set, get) => ({
  services: igelServices,
  transactions: initialIgelTransactions,
  createService: (payload) => {
    const service: IgelService = {
      ...payload,
      id: payload.id ?? generateServiceId(),
    };
    set((state) => ({ services: [service, ...state.services] }));
    return service;
  },
  updateService: (id, changes) =>
    set((state) => ({
      services: state.services.map((service) =>
        service.id === id ? { ...service, ...changes } : service,
      ),
    })),
  deleteService: (id) =>
    set((state) => ({ services: state.services.filter((service) => service.id !== id) })),
  recordSale: ({ patient, serviceId, paymentMethod, collector, notes }) => {
    const service = get().services.find((entry) => entry.id === serviceId);
    if (!service) return null;
    const transaction: IgelTransaction = {
      id: generateTransactionId(),
      patient,
      serviceId,
      collector,
      paymentMethod,
      amount: service.price,
      createdAt: new Date().toISOString(),
      notes,
    };
    set((state) => ({ transactions: [transaction, ...state.transactions] }));

    const adjustStock = useInventoryStore.getState().adjustStock;
    service.materials.forEach((material) => {
      adjustStock({
        itemId: material.itemId,
        quantity: material.quantity,
        actor: collector,
        note: "IGeL Verkauf " + service.name,
      });
    });

    if (paymentMethod === "Bar") {
      const employeeDirectory = useEmployeeDirectory.getState();
      const matchedEmployee = employeeDirectory.employees.find((entry) => entry.name === collector);
      useCashDrawerStore.getState().registerSale({
        amount: service.price,
        description: `IGeL Verkauf ${service.name}`,
        referenceId: transaction.id,
        employeeId: matchedEmployee?.id,
      });
    }

    return transaction;
  },
  updateTransaction: (id, changes) =>
    set((state) => ({
      transactions: state.transactions.map((transaction) =>
        transaction.id === id ? { ...transaction, ...changes } : transaction,
      ),
    })),
  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((transaction) => transaction.id !== id),
    })),
}));

export function selectTransactionsByPeriod(transactions: IgelTransaction[], period: "day" | "week" | "month") {
  const now = new Date();
  return transactions.filter((transaction) => {
    const date = new Date(transaction.createdAt);
    if (period === "day") {
      return date.toDateString() === now.toDateString();
    }
    if (period === "week") {
      const diff = now.getTime() - date.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    }
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
}

export type { IgelService, IgelTransaction, PaymentMethod };
export type { CreateServicePayload, UpdateServicePayload, UpdateTransactionPayload };
