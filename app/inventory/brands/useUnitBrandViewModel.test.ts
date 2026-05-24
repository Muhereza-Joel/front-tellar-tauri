import { renderHook, act } from "@testing-library/react";
import { useBrandViewModel } from "./useBrandViewModel";
import { getDatabase } from "../../../db";
import { useAuth } from "../../context/AuthContext";

// Mock internal architecture dependencies
jest.mock("../../../db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("uuid", () => ({
  v7: () => "mocked-uuid-v7",
}));

describe("useBrandViewModel Hook", () => {
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
        brands: {
          findMany: mockFindMany,
        },
      },
      insert: mockInsert,
      update: mockUpdate,
    };

    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    (useAuth as jest.Mock).mockReturnValue({
      getTenantId: () => "tenant-123",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const flushAsyncOperations = async () => {
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
  };

  it("should initialize with default states and load data on mount", async () => {
    mockFindMany.mockResolvedValue([
      { uuid: "1", name: "Sony", slug: "sony", description: "Electronics" },
    ]);

    const { result } = renderHook(() => useBrandViewModel());

    expect(result.current.loading).toBe(true);
    expect(result.current.formData.name).toBe("");

    await flushAsyncOperations();

    expect(result.current.loading).toBe(false);
    expect(mockFindMany).toHaveBeenCalled();
  });

  it("should automatically generate a compliant slug when the brand name changes", async () => {
    const { result } = renderHook(() => useBrandViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.updateField("name", "  Logitech G-Series!!!  ");
    });

    // Check slug rules application: lowercase, stripped special characters, spaces to single hyphens
    expect(result.current.formData.name).toBe("  Logitech G-Series!!!  ");
    expect(result.current.formData.slug).toBe("logitech-g-series");
  });

  it("should fail validation and set errors if required fields are missing on save", async () => {
    const { result } = renderHook(() => useBrandViewModel());
    await flushAsyncOperations();

    // Force clear slug to test validation
    act(() => {
      result.current.setFormData({ name: "", slug: "", description: "" });
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.name).toBe("Brand name is required");
    expect(result.current.errors.slug).toBe("Slug is required");
  });

  it("should fail validation if an invalid slug format is passed manually", async () => {
    const { result } = renderHook(() => useBrandViewModel());
    await flushAsyncOperations();

    act(() => {
      // Manually force an invalid slug with uppercase letters and invalid spaces
      result.current.setFormData({
        name: "Apple",
        slug: "Apple Inc Spaces",
        description: "",
      });
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.slug).toBe(
      "Use lowercase, numbers, and hyphens only",
    );
  });

  it("should insert a new brand successfully on valid form submission", async () => {
    const { result } = renderHook(() => useBrandViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.updateField("name", "Samsung");
      result.current.updateField("description", "Premium displays");
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });
    await flushAsyncOperations();

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: "mocked-uuid-v7",
        name: "Samsung",
        slug: "samsung",
        tenant_id: "tenant-123",
        sync_status: "created",
      }),
    );
    expect(result.current.formData.name).toBe("");
  });

  it("should execute update sequence when editing a brand", async () => {
    const { result } = renderHook(() => useBrandViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.startEdit({
        uuid: "brand-111",
        name: "Nike",
        slug: "nike",
        description: "Sportswear",
      });
    });

    expect(result.current.editingUuid).toBe("brand-111");

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });
    await flushAsyncOperations();

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Nike",
        sync_status: "updated",
      }),
    );
    expect(result.current.editingUuid).toBeNull();
  });

  it("should execute soft delete sequence on calling deleteBrand", async () => {
    const { result } = renderHook(() => useBrandViewModel());
    await flushAsyncOperations();

    await act(async () => {
      await result.current.deleteBrand("brand-to-delete");
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

  it("should handle database rejection gracefully on load without logging pollution", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockFindMany.mockRejectedValue(new Error("Database connection timeout"));

    const { result } = renderHook(() => useBrandViewModel());
    expect(result.current.loading).toBe(true);

    await flushAsyncOperations();

    expect(result.current.loading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load brands database data:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("should clear error messages dynamically when user types in an input field", async () => {
    const { result } = renderHook(() => useBrandViewModel());
    await flushAsyncOperations();

    // Trigger validation errors
    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });
    expect(result.current.errors.name).toBeDefined();

    // Typing resolves the error state instantly
    act(() => {
      result.current.updateField("name", "Asus");
    });

    expect(result.current.errors.name).toBeUndefined();
  });

  describe("Brands Pagination & Filtering", () => {
    it("should filter brand results on client side when search term changes", async () => {
      mockFindMany.mockResolvedValue([
        { uuid: "1", name: "Apple", slug: "apple", description: "Phones" },
        { uuid: "2", name: "Microsoft", slug: "microsoft", description: "OS" },
      ]);

      const { result } = renderHook(() => useBrandViewModel());
      await flushAsyncOperations();

      expect(result.current.brandsList.length).toBe(2);

      act(() => {
        result.current.setSearchTerm("Apple");
      });

      expect(result.current.brandsList.length).toBe(1);
      expect(result.current.brandsList[0].name).toBe("Apple");
    });

    it("should reset current page to 1 when search execution triggers", async () => {
      const dummyBrands = Array.from({ length: 15 }, (_, i) => ({
        uuid: `id-${i}`,
        name: `Brand ${i}`,
        slug: `brand-${i}`,
        description: "Test",
      }));
      mockFindMany.mockResolvedValue(dummyBrands);

      const { result } = renderHook(() => useBrandViewModel());
      await flushAsyncOperations();

      act(() => {
        result.current.setCurrentPage(2);
      });
      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.setSearchTerm("Brand 1");
      });

      expect(result.current.currentPage).toBe(1);
    });
  });
});
