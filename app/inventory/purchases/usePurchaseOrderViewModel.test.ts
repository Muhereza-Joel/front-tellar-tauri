import { renderHook, act } from "@testing-library/react";
import { usePurchaseOrderViewModel } from "./usePurchaseOrderViewModel";
import { getDatabase } from "../../../db";
import { useAuth } from "../../context/AuthContext";

// Mock architecture dependencies
jest.mock("../../../db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn(),
}));

jest.mock("uuid", () => ({
  v7: () => "mocked-po-uuid-v7",
}));

/**
 * Safely extracts a string key name from either a string or a Drizzle table schema object
 */
function getTableName(table: any): string {
  if (typeof table === "string") return table;
  if (table && typeof table === "object") {
    return (
      table.SymbolFor?.("drizzle:Name") ||
      table._?.name ||
      Object.keys(table)[0] ||
      ""
    );
  }
  return "";
}

/**
 * Creates a mock Drizzle database that supports fluent query chaining.
 * @param tables - Record of table names to array of rows
 */
function createMockDb(tables: Record<string, any[]>) {
  // Normalize lookup keys to maximize matching probability (e.g. "purchase_orders" -> "purchaseorders")
  const normalizedTables: Record<string, any[]> = {};
  Object.keys(tables).forEach((key) => {
    normalizedTables[key.toLowerCase().replace(/[^a-z0-9]/g, "")] = tables[key];
  });

  const queryBuilder: any = {
    _tableData: [] as any[],
    from(table: any) {
      const rawName =
        getTableName(table) || (table?.toString ? table.toString() : "");
      const normalizedQueryName = rawName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      // Direct normalized match or fallback substring search
      let matchedData = normalizedTables[normalizedQueryName];
      if (!matchedData) {
        const structuralKey = Object.keys(normalizedTables).find(
          (k) =>
            normalizedQueryName.includes(k) || k.includes(normalizedQueryName),
        );
        matchedData = structuralKey ? normalizedTables[structuralKey] : [];
      }

      this._tableData = matchedData;
      return this;
    },
    where() {
      return this;
    },
    orderBy() {
      return this;
    },
    limit() {
      return this;
    },
    offset() {
      return this;
    },
    then(resolve: (value: any) => void) {
      // Return a shallow copy to prevent state pollution mutations across hook iterations
      resolve([...this._tableData]);
    },
  };

  // Make the query builder thenable (so await works)
  queryBuilder.catch = () => queryBuilder;

  const db = {
    select: () => queryBuilder,
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue({}),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue({}),
      }),
    }),
  };
  return db;
}

describe("usePurchaseOrderViewModel Hook Suite", () => {
  const mockSuppliers = [
    { uuid: "sup-1", name: "Supplier A", deleted_at: null },
    { uuid: "sup-2", name: "Supplier B", deleted_at: null },
  ];

  const mockPOs = [
    {
      uuid: "po-1",
      po_number: "PO-001",
      status: "DRAFT",
      vendor_name: "Supplier A",
      created_at: "2025-01-01",
      deleted_at: null,
    },
    {
      uuid: "po-2",
      po_number: "PO-002",
      status: "SENT",
      vendor_name: "Supplier B",
      created_at: "2025-01-02",
      deleted_at: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Support flexible mapping variants using multi-key structural safety patterns
    const mockDb = createMockDb({
      purchase_orders: mockPOs,
      purchaseOrders: mockPOs,
      suppliers: mockSuppliers,
      purchase_order_items: [],
      purchaseOrderItems: [],
    });
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);

    (useAuth as jest.Mock).mockReturnValue({
      hasPermission: () => true,
    });

    (require("@tauri-apps/api/core").invoke as jest.Mock).mockResolvedValue(
      "PO-TEST-001",
    );
  });

  // Helper to flush all pending promises and effects
  const flushPromises = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  describe("Purchase Order Line Item Computations", () => {
    it("should accurately manage items and re-calculate subtotal and absolute totals", async () => {
      const { result } = renderHook(() => usePurchaseOrderViewModel());
      await flushPromises(); // ensure db ready

      const targetProduct = {
        uuid: "prod-100",
        name: "Amoxicillin 500mg",
        sku: "AMX-500",
        cost_price: 15000,
      };

      act(() => {
        result.current.addItem(targetProduct);
      });

      expect(result.current.items.length).toBe(1);
      expect(result.current.items[0].product_name).toBe("Amoxicillin 500mg");
      expect(result.current.totals.total).toBe(15000);

      act(() => {
        result.current.addItem(targetProduct);
      });
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.totals.total).toBe(30000);

      act(() => {
        result.current.updateItem(0, "unit_price", 20000);
      });
      expect(result.current.totals.total).toBe(40000);

      act(() => {
        result.current.removeItem(0);
      });
      expect(result.current.items.length).toBe(0);
      expect(result.current.totals.total).toBe(0);
    });
  });

  describe("Data Persistence and Schema Validations", () => {
    it("should generate errors when trying to persist invalid structural payloads", async () => {
      const { result } = renderHook(() => usePurchaseOrderViewModel());
      await flushPromises();

      act(() => {
        result.current.handleCreateNew();
      });
      await flushPromises();

      act(() => {
        result.current.setFormData({
          po_number: "",
          vendor_uuid: "",
          vendor_name: "",
          issue_date: "",
        });
      });

      await act(async () => {
        const dummyEvent = { preventDefault: jest.fn() };
        await result.current.handleSave(dummyEvent);
      });

      expect(result.current.errors).toBeDefined();
      expect(result.current.errors.po_number).toContain(
        "PO Number is required",
      );
      expect(result.current.errors.vendor_uuid).toContain(
        "Supplier selection is required",
      );
    });

    it("should execute insert operation on valid draft save routines", async () => {
      const mockDb = createMockDb({
        purchase_orders: [],
        purchaseOrders: [],
        suppliers: mockSuppliers,
        purchase_order_items: [],
        purchaseOrderItems: [],
      });
      (getDatabase as jest.Mock).mockResolvedValue(mockDb);

      const { result } = renderHook(() => usePurchaseOrderViewModel());
      await flushPromises();

      act(() => {
        result.current.handleCreateNew();
      });
      await flushPromises();

      act(() => {
        result.current.setFormData({
          po_number: "PO-2026-001",
          vendor_uuid: "vendor-uuid-xyz",
          vendor_name: "Med-Line Logistics",
          issue_date: "2026-05-24",
          status: "DRAFT",
        });
      });

      act(() => {
        result.current.addItem({
          uuid: "prod-1",
          name: "Test Product",
          sku: "TP-01",
          cost_price: 100,
        });
      });

      await act(async () => {
        const dummyEvent = { preventDefault: jest.fn() };
        await result.current.handleSave(dummyEvent);
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.current.errors).toEqual({});
    });
  });
});
