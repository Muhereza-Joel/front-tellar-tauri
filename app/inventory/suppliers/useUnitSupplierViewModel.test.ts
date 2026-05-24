import { renderHook, act } from "@testing-library/react";
import { useSupplierViewModel } from "./useSupplierViewModel";
import { getDatabase } from "../../../db";
import { useAuth } from "../../context/AuthContext";

// 1. Mock internal architecture infrastructure dependencies
jest.mock("../../../db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("uuid", () => ({
  v7: () => "mocked-supplier-uuid-v7",
}));

describe("useSupplierViewModel Hook", () => {
  let mockDb: any;
  let mockFindMany: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockWhere: jest.Mock;
  let mockValues: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Setup pristine fluid chains for Drizzle ORM
    mockFindMany = jest.fn().mockResolvedValue([]);
    mockValues = jest.fn().mockResolvedValue(true);
    mockInsert = jest.fn().mockReturnValue({ values: mockValues });

    mockWhere = jest.fn().mockResolvedValue(true);
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

    mockDb = {
      query: {
        suppliers: {
          findMany: mockFindMany,
        },
      },
      insert: mockInsert,
      update: mockUpdate,
    };

    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    (useAuth as jest.Mock).mockReturnValue({
      getTenantId: () => "tenant-supplier-123",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper utility to step over hooks async microtask timeouts safely
  const flushAsyncOperations = async () => {
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
  };

  it("should initialize with accurate schema primitive default configurations", async () => {
    const { result } = renderHook(() => useSupplierViewModel());
    expect(result.current.loading).toBe(true);
    expect(result.current.formData.name).toBe("");
    expect(result.current.formData.is_preferred).toBe(false);

    await flushAsyncOperations();
    expect(result.current.loading).toBe(false);
  });

  it("should populate the local form data elements correctly upon field tracking", async () => {
    const { result } = renderHook(() => useSupplierViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.setFormData((prev: any) => ({
        ...prev,
        name: "MedPharma Distributors",
        email: "orders@medpharma.com",
        city: "Kampala",
      }));
    });

    expect(result.current.formData.name).toBe("MedPharma Distributors");
    expect(result.current.formData.email).toBe("orders@medpharma.com");
    expect(result.current.formData.city).toBe("Kampala");
  });

  it("should reject submissions and set errors if required fields are missing", async () => {
    const { result } = renderHook(() => useSupplierViewModel());
    await flushAsyncOperations();

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.name).toBe("Supplier name is required");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("should enforce validation rules regarding invalid url and email structures", async () => {
    const { result } = renderHook(() => useSupplierViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.setFormData((prev: any) => ({
        ...prev,
        name: "Global Labs Ltd",
        email: "malformed-email-string",
        website: "invalid-url-format",
      }));
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.email).toBe("Invalid email");
    expect(result.current.errors.website).toBe("Invalid URL");
  });

  it("should execute insert operation smoothly upon dispatching a valid schema form payload", async () => {
    const { result } = renderHook(() => useSupplierViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.setFormData((prev: any) => ({
        ...prev,
        name: "Biotech Supplies East Africa",
        email: "info@biotech.co.ug",
        credit_limit: 5000,
      }));
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });
    await flushAsyncOperations();

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: "mocked-supplier-uuid-v7",
        name: "Biotech Supplies East Africa",
        tenant_id: "tenant-supplier-123",
        sync_status: "created",
      }),
    );
    expect(result.current.formData.name).toBe(""); // Resets correctly
  });

  it("should map supplier details into field primitives upon execution of startEdit", async () => {
    const { result } = renderHook(() => useSupplierViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.startEdit({
        uuid: "supplier-edit-id-99",
        name: "AgroVet Holdings",
        email: "contact@agrovet.com",
        credit_limit: 15000,
      });
    });

    expect(result.current.editingUuid).toBe("supplier-edit-id-99");
    expect(result.current.formData.name).toBe("AgroVet Holdings");
    expect(result.current.formData.email).toBe("contact@agrovet.com");
  });

  it("should process update statement definitions accurately when editing a record", async () => {
    const { result } = renderHook(() => useSupplierViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.startEdit({
        uuid: "supplier-edit-id-99",
        name: "AgroVet Holdings",
        email: "contact@agrovet.com",
      });
    });

    act(() => {
      result.current.setFormData((prev: any) => ({
        ...prev,
        name: "AgroVet Holdings Ltd",
      }));
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });
    await flushAsyncOperations();

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "AgroVet Holdings Ltd",
        sync_status: "updated",
      }),
    );
    expect(result.current.editingUuid).toBeNull();
  });

  it("should record a timestamp signature onto deleted_at field attributes upon deleteSupplier execution", async () => {
    const { result } = renderHook(() => useSupplierViewModel());
    await flushAsyncOperations();

    await act(async () => {
      await result.current.deleteSupplier("supplier-delete-target");
    });
    await flushAsyncOperations();

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        sync_status: "deleted",
        deleted_at: expect.any(String),
      }),
    );
  });

  describe("useSupplierViewModel Hook - Duplicate Prevention System", () => {
    it("should intercept submission and flag errors if the supplier name matches in-memory collections case-insensitively", async () => {
      // Pre-hydrate in-memory lookahead state through resolving fetch results
      mockFindMany.mockResolvedValue([
        {
          uuid: "registered-supplier-uuid",
          name: "  Nile Pharmaceuticals  ",
          is_active: true,
        },
      ]);

      const { result } = renderHook(() => useSupplierViewModel());
      await flushAsyncOperations(); // hydrations complete

      // Enter duplicate name variation
      act(() => {
        result.current.setFormData((prev: any) => ({
          ...prev,
          name: "nile pharmaceuticals",
        }));
      });

      const mockEvent = { preventDefault: jest.fn() } as any;
      await act(async () => {
        await result.current.handleSave(mockEvent);
      });
      await flushAsyncOperations();

      expect(result.current.errors.name).toBe(
        "A supplier with this name already exists",
      );
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("should allow saving edits without self-triggering duplicate exceptions", async () => {
      mockFindMany.mockResolvedValue([
        {
          uuid: "registered-supplier-uuid",
          name: "Nile Pharmaceuticals",
          is_active: true,
        },
      ]);

      const { result } = renderHook(() => useSupplierViewModel());
      await flushAsyncOperations();

      act(() => {
        result.current.startEdit({
          uuid: "registered-supplier-uuid",
          name: "Nile Pharmaceuticals",
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as any;
      await act(async () => {
        await result.current.handleSave(mockEvent);
      });
      await flushAsyncOperations();

      expect(result.current.errors.name).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe("Suppliers Pagination & Search Filtering Layer", () => {
    it("should filter results dynamically when typing lookahead search expressions", async () => {
      mockFindMany.mockResolvedValue([
        { uuid: "s1", name: "Express Logistics", contact_person: "John" },
        { uuid: "s2", name: "Astra Wholesale", contact_person: "Mary" },
      ]);

      const { result } = renderHook(() => useSupplierViewModel());
      await flushAsyncOperations();

      expect(result.current.suppliersList.length).toBe(2);

      act(() => {
        result.current.setSearchTerm("Astra");
      });

      expect(result.current.suppliersList.length).toBe(1);
      expect(result.current.suppliersList[0].name).toBe("Astra Wholesale");
    });

    it("should force active page pointer to reset to index 1 upon changing search constraints", async () => {
      const complexSuppliersList = Array.from({ length: 14 }, (_, i) => ({
        uuid: `id-${i}`,
        name: `Supplier Logistics Corp ${i}`,
      }));
      mockFindMany.mockResolvedValue(complexSuppliersList);

      const { result } = renderHook(() => useSupplierViewModel());
      await flushAsyncOperations();

      act(() => {
        result.current.setCurrentPage(2);
      });
      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.setSearchTerm("Corp 12");
      });
      expect(result.current.currentPage).toBe(1);
    });
  });
});
