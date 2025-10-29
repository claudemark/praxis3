import { describe, expect, it, beforeEach } from "vitest";

import { useCashDrawerStore } from "./cash-drawer-store";

describe("cash drawer store", () => {
  beforeEach(() => {
    useCashDrawerStore.setState((state) => ({
      ...state,
      movements: state.movements.slice(-1),
      currentBalance: state.movements.slice(-1)[0]?.balanceAfter ?? state.currentBalance,
      snapshots: [],
      lastReconcile: undefined,
    }));
  });

  it("increases balance when registering a sale", () => {
    const initial = useCashDrawerStore.getState().currentBalance;
    useCashDrawerStore.getState().registerSale({ amount: 50, description: "Test Barverkauf" });
    const updated = useCashDrawerStore.getState().currentBalance;
    expect(updated).toBeCloseTo(initial + 50);
  });

  it("decreases balance when registering an expense", () => {
    const initial = useCashDrawerStore.getState().currentBalance;
    useCashDrawerStore.getState().registerExpense({
      amount: 20,
      description: "Milch",
      employeeId: "emp-linde",
    });
    const updated = useCashDrawerStore.getState().currentBalance;
    expect(updated).toBeCloseTo(initial - 20);
  });

  it("records snapshot differences as reconcile movements", () => {
    useCashDrawerStore.getState().recordSnapshot({ countedAmount: 10, note: "Test" });
    const movements = useCashDrawerStore.getState().movements;
    const reconcileMovement = movements.find((movement) => movement.type === "reconcile");
    expect(reconcileMovement).toBeDefined();
  });
});
