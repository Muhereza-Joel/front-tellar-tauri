import { renderHook, act } from "@testing-library/react";
import { useCategoryViewModel } from "./useCategoryViewModel";
import { getDatabase } from "../../../db";
import { useAuth } from "../../context/AuthContext";

// Mock infrastructure dependencies
jest.mock("../../../db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("uuid", () => ({
  v7: () => "mocked-uuid-v7",
}));

describe("useCategoryViewModel Hook", () => {
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

    mockFindMany = jest.fn().mockResolvedValue([]);
    mockValues = jest.fn().mockResolvedValue(true);
    mockInsert = jest.fn().mockReturnValue({ values: mockValues });

    mockWhere = jest.fn().mockResolvedValue(true);
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

    mockDb = {
      query: {
        categories: {
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

  it("should block creation if the category name matches an existing entity", async () => {
    // Seed an existing item into the local cache list
    mockFindMany.mockResolvedValue([
      { uuid: "existing-1", name: "Electronics", parent_id: null },
    ]);

    const { result } = renderHook(() => useCategoryViewModel());
    await flushAsyncOperations();

    // Type the exact duplicate name
    act(() => {
      result.current.updateField("name", "  Electronics  "); // spaces should be trimmed
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.name).toBe(
      "A category with this name already exists",
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("should gracefully catch unique constraint failures thrown directly from the database engine", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Simulate no client-side matches, but a database unique constraint failure occurs on submit
    mockFindMany.mockResolvedValue([]);
    mockValues.mockRejectedValue(
      new Error("UNIQUE constraint failed: categories.name (code: 2067)"),
    );

    const { result } = renderHook(() => useCategoryViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.updateField("name", "Hardware");
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.name).toBe(
      "A category with this name already exists",
    );
    consoleSpy.mockRestore();
  });

  it("should allow editing a record using its own current name", async () => {
    mockFindMany.mockResolvedValue([
      { uuid: "edit-target-1", name: "Groceries", parent_id: null },
    ]);

    const { result } = renderHook(() => useCategoryViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.startEdit({
        uuid: "edit-target-1",
        name: "Groceries",
        parent_id: null,
      });
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.name).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("should initialize with default states and load categories on mount", async () => {
    mockFindMany.mockResolvedValue([
      { uuid: "cat-1", name: "Electronics", parent_id: null },
    ]);

    const { result } = renderHook(() => useCategoryViewModel());

    expect(result.current.loading).toBe(true);
    expect(result.current.formData.name).toBe("");

    await flushAsyncOperations();

    expect(result.current.loading).toBe(false);
    expect(mockFindMany).toHaveBeenCalled();
    expect(result.current.allCategories.length).toBe(1);
  });

  it("should handle basic form tracking changes via updateField", async () => {
    const { result } = renderHook(() => useCategoryViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.updateField("name", "Home Appliances");
      result.current.updateField("parent_id", "parent-uuid");
    });

    expect(result.current.formData.name).toBe("Home Appliances");
    expect(result.current.formData.parent_id).toBe("parent-uuid");
  });

  it("should reject saving if the category name is missing", async () => {
    const { result } = renderHook(() => useCategoryViewModel());
    await flushAsyncOperations();

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.name).toBe("Category name is required");
  });

  it("should prevent a category from choosing itself as a parent", async () => {
    const { result } = renderHook(() => useCategoryViewModel());
    await flushAsyncOperations();

    // Setup an editing context
    act(() => {
      result.current.startEdit({
        uuid: "target-id-55",
        name: "Laptops",
        parent_id: null,
      });
    });

    // Attempt to set parent to its own ID
    act(() => {
      result.current.updateField("parent_id", "target-id-55");
    });

    // UPDATED: Removed the duplicate "parent" word to match hook implementation
    expect(result.current.errors.parent_id).toBe(
      "A category cannot be its own parent",
    );

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should insert a new top-level category on valid submission", async () => {
    const { result } = renderHook(() => useCategoryViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.updateField("name", "Books");
      result.current.updateField("parent_id", ""); // empty dropdown choice
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
        name: "Books",
        parent_id: null, // Check transform worked
        sync_status: "created",
      }),
    );
  });

  it("should execute soft delete sequence on calling deleteCategory", async () => {
    const { result } = renderHook(() => useCategoryViewModel());
    await flushAsyncOperations();

    await act(async () => {
      await result.current.deleteCategory("delete-me");
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

  it("should clear validation errors as the user types", async () => {
    const { result } = renderHook(() => useCategoryViewModel());
    await flushAsyncOperations();

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });
    expect(result.current.errors.name).toBeDefined();

    act(() => {
      result.current.updateField("name", "Kitchenware");
    });

    expect(result.current.errors.name).toBeUndefined();
  });

  it("should handle database connection rejections cleanly on load", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockFindMany.mockRejectedValue(new Error("Timeout connection"));

    const { result } = renderHook(() => useCategoryViewModel());
    await flushAsyncOperations();

    expect(result.current.loading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load categories database data:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  describe("Categories Pagination Filter Set", () => {
    it("should filter category items on client side using the search field", async () => {
      mockFindMany.mockResolvedValue([
        { uuid: "1", name: "Stationery", parent_id: null },
        { uuid: "2", name: "Clothing", parent_id: null },
      ]);

      const { result } = renderHook(() => useCategoryViewModel());
      await flushAsyncOperations();

      expect(result.current.categoriesList.length).toBe(2);

      act(() => {
        result.current.setSearchTerm("Cloth");
      });

      expect(result.current.categoriesList.length).toBe(1);
      expect(result.current.categoriesList[0].name).toBe("Clothing");
    });
  });
});
