import { renderHook, act } from "@testing-library/react";
import { useUnitViewModel } from "./useUnitViewModel";
import { getDatabase } from "../../../db";
import { useAuth } from "../../context/AuthContext";

// 1. Mock infrastructure dependencies
jest.mock("../../../db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("uuid", () => ({
  v7: () => "mocked-uuid-v7",
}));

describe("useUnitViewModel Hook", () => {
  let mockDb: any;
  let mockFindMany: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockWhere: jest.Mock;
  let mockValues: jest.Mock;
  let mockSet: jest.Mock;

  // Drizzle Fluent Chains for Select/Duplicate Layer Engine
  let mockSelect: jest.Mock;
  let mockFrom: jest.Mock;
  let mockSelectWhere: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Re-creating fluid chains for Drizzle ORM
    mockFindMany = jest.fn().mockResolvedValue([]);
    mockValues = jest.fn().mockResolvedValue(true);
    mockInsert = jest.fn().mockReturnValue({ values: mockValues });

    mockWhere = jest.fn().mockResolvedValue(true);
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

    // Mocking select statement pipeline: db.select().from().where()
    mockSelectWhere = jest.fn().mockResolvedValue([]); // Default to no duplicates
    mockFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockFrom });

    mockDb = {
      query: {
        units: {
          findMany: mockFindMany,
        },
      },
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
    };

    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    (useAuth as jest.Mock).mockReturnValue({
      getTenantId: () => "tenant-123",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper utility to safely step forward over microtasks and the 500ms delay
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
      {
        uuid: "1",
        name: "Kg",
        singular: "Kilo",
        plural: "Kilos",
        is_active: true,
      },
    ]);

    const { result } = renderHook(() => useUnitViewModel());

    expect(result.current.loading).toBe(true);
    expect(result.current.formData.name).toBe("");

    await flushAsyncOperations();

    expect(result.current.loading).toBe(false);
    expect(mockFindMany).toHaveBeenCalled();
  });

  it("should handle form input tracking correctly using updateField", async () => {
    const { result } = renderHook(() => useUnitViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.updateField("name", "Box");
      result.current.updateField("singular", "Box");
      result.current.updateField("plural", "Boxes");
      result.current.updateField("is_active", false);
    });

    expect(result.current.formData.name).toBe("Box");
    expect(result.current.formData.singular).toBe("Box");
    expect(result.current.formData.plural).toBe("Boxes");
    expect(result.current.formData.is_active).toBe(false);
  });

  it("should fail validation and set errors if required fields are missing on save", async () => {
    const { result } = renderHook(() => useUnitViewModel());
    await flushAsyncOperations();

    const mockEvent = { preventDefault: jest.fn() } as any;

    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.name).toBe("Unit name is required");
    expect(result.current.errors.singular).toBe("Singular label is required");
    expect(result.current.errors.plural).toBe("Plural label is required");
  });

  it("should insert a new unit successfully on valid form submission", async () => {
    const { result } = renderHook(() => useUnitViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.updateField("name", "Liters");
      result.current.updateField("singular", "Liter");
      result.current.updateField("plural", "Liters");
      result.current.updateField("description", "Standard liquid volume");
      result.current.updateField("is_active", true);
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
        name: "Liters",
        tenant_id: "tenant-123",
        sync_status: "created",
      }),
    );

    expect(result.current.formData.name).toBe("");
  });

  it("should populate form and execute update sequence when editing a unit", async () => {
    const { result } = renderHook(() => useUnitViewModel());
    await flushAsyncOperations();

    const existingUnit = {
      uuid: "unit-999",
      name: "Gram",
      singular: "Gram",
      plural: "Grams",
      description: "Weight unit",
      is_active: true,
    };

    act(() => {
      result.current.startEdit(existingUnit);
    });

    expect(result.current.editingUuid).toBe("unit-999");
    expect(result.current.formData.name).toBe("Gram");

    const mockEvent = { preventDefault: jest.fn() } as any;

    await act(async () => {
      await result.current.handleSave(mockEvent);
    });
    await flushAsyncOperations();

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Gram",
        sync_status: "updated",
      }),
    );
    expect(result.current.editingUuid).toBeNull();
  });

  it("should execute soft delete sequence on calling deleteUnit", async () => {
    const { result } = renderHook(() => useUnitViewModel());
    await flushAsyncOperations();

    await act(async () => {
      await result.current.deleteUnit("target-uuid");
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

  it("should completely reset the form states on calling resetForm", async () => {
    const { result } = renderHook(() => useUnitViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.startEdit({
        uuid: "some-id",
        name: "Temp",
        singular: "T",
        plural: "Ts",
        is_active: true,
      });
      result.current.resetForm();
    });

    expect(result.current.editingUuid).toBeNull();
    expect(result.current.formData.name).toBe("");
  });

  it("should filter results on client side when search term changes", async () => {
    mockFindMany.mockResolvedValue([
      {
        uuid: "1",
        name: "Kilogram",
        singular: "Kilo",
        plural: "Kilos",
        is_active: true,
      },
      {
        uuid: "2",
        name: "Liters",
        singular: "Liter",
        plural: "Liters",
        is_active: true,
      },
    ]);

    const { result } = renderHook(() => useUnitViewModel());
    await flushAsyncOperations();

    expect(result.current.unitsList.length).toBe(2);

    act(() => {
      result.current.setSearchTerm("Liters");
    });

    expect(result.current.unitsList.length).toBe(1);
    expect(result.current.unitsList[0].name).toBe("Liters");
  });

  it("should handle database rejection gracefully on load", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockFindMany.mockRejectedValue(new Error("Database connection timeout"));

    const { result } = renderHook(() => useUnitViewModel());
    expect(result.current.loading).toBe(true);

    await flushAsyncOperations();

    expect(result.current.loading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load units database data:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("should fail validation if fields contain only whitespace", async () => {
    const { result } = renderHook(() => useUnitViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.updateField("name", "   ");
      result.current.updateField("singular", "  ");
      result.current.updateField("plural", "    ");
      result.current.updateField("description", "   ");
      result.current.updateField("is_active", true);
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.name).toBe("Unit name is required");
    expect(result.current.errors.singular).toBe("Singular label is required");
    expect(result.current.errors.plural).toBe("Plural label is required");
  });

  it("should trim string inputs before submitting to the database", async () => {
    const { result } = renderHook(() => useUnitViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.updateField("name", "  Liters  ");
      result.current.updateField("singular", " Liter ");
      result.current.updateField("plural", " Liters ");
      result.current.updateField("description", "   Volume   ");
      result.current.updateField("is_active", true);
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });
    await flushAsyncOperations();

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Liters",
        singular: "Liter",
        plural: "Liters",
        description: "Volume",
      }),
    );
  });

  it("should automatically clear a field-specific error when updateField is executed for that input", async () => {
    const { result } = renderHook(() => useUnitViewModel());
    await flushAsyncOperations();

    // 1. Trigger validation failures to populate errors state
    const mockEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSave(mockEvent);
    });
    expect(result.current.errors.name).toBeDefined();

    // 2. Type into the name field via updateField
    act(() => {
      result.current.updateField("name", "Kilograms");
    });

    // 3. Assert error has been cleaned up for 'name', while leaving others intact
    expect(result.current.errors.name).toBeUndefined();
    expect(result.current.errors.singular).toBeDefined();
  });

  describe("useUnitViewModel Hook - Pagination Functionality", () => {
    it("should automatically reset currentPage to 1 when a search term is specified", async () => {
      const dummyUnits = Array.from({ length: 15 }, (_, i) => ({
        uuid: `id-${i}`,
        name: `Unit ${i}`,
        singular: "Item",
        plural: "Items",
        is_active: true,
      }));
      mockFindMany.mockResolvedValue(dummyUnits);

      const { result } = renderHook(() => useUnitViewModel());
      await flushAsyncOperations();

      act(() => {
        result.current.setCurrentPage(2);
      });
      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.setSearchTerm("Unit 1");
      });

      expect(result.current.currentPage).toBe(1);
    });

    it("should gracefully re-adjust current page pointer when page size alterations occur", async () => {
      const dummyUnits = Array.from({ length: 12 }, (_, i) => ({
        uuid: `id-${i}`,
        name: `Box ${i}`,
        singular: "Box",
        plural: "Boxes",
        is_active: true,
      }));
      mockFindMany.mockResolvedValue(dummyUnits);

      const { result } = renderHook(() => useUnitViewModel());
      await flushAsyncOperations();

      act(() => {
        result.current.setCurrentPage(2);
      });
      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.setPageSize(20);
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(1);
    });

    it("should automatically clamp down active page index if data deletions shrink current boundary bounds", async () => {
      const initialUnits = Array.from({ length: 11 }, (_, i) => ({
        uuid: `id-${i}`,
        name: `Pack ${i}`,
        singular: "Pack",
        plural: "Packs",
        is_active: true,
      }));
      mockFindMany.mockResolvedValue(initialUnits);

      const { result } = renderHook(() => useUnitViewModel());
      await flushAsyncOperations();

      act(() => {
        result.current.setCurrentPage(2);
      });
      expect(result.current.currentPage).toBe(2);
      expect(result.current.unitsList.length).toBe(1);

      const shrankUnits = initialUnits.slice(0, 10);
      mockFindMany.mockResolvedValue(shrankUnits);

      await act(async () => {
        await result.current.deleteUnit("id-10");
      });
      await flushAsyncOperations();

      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(1);
    });
  });

  describe("useUnitViewModel Hook - Duplicate Prevention System", () => {
    it("should block registration and raise an error if unit name matches case-insensitively", async () => {
      // 1. Pre-hydrate the database findMany lookup so that unitsList receives the active duplicate record on hook load
      mockFindMany.mockResolvedValue([
        {
          uuid: "existing-uuid",
          name: "  BOX-STANDARD ",
          singular: "Box",
          plural: "Boxes",
          is_active: true,
          tenant_id: "tenant-123",
        },
      ]);

      const { result } = renderHook(() => useUnitViewModel());

      // Flush operations to allow loadData() to resolve and hydrate result.current.unitsList
      await flushAsyncOperations();

      // 2. Stage the duplicate form inputs
      act(() => {
        result.current.updateField("name", "box-standard");
        result.current.updateField("singular", "Box");
        result.current.updateField("plural", "Boxes");
      });

      const mockEvent = { preventDefault: jest.fn() } as any;

      await act(async () => {
        await result.current.handleSave(mockEvent);
      });
      await flushAsyncOperations();

      // 3. Asset that local in-memory validations caught it before hitting the DB layer
      expect(result.current.errors.name).toBe(
        "A unit with this name already exists",
      );
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("should allow editing current entity name to be updated without matching self as duplicate", async () => {
      // Pre-hydrate the target edit unit into unitsList
      mockFindMany.mockResolvedValue([
        {
          uuid: "edit-target-id",
          name: "Roll",
          singular: "Roll",
          plural: "Rolls",
          is_active: true,
          tenant_id: "tenant-123",
        },
      ]);

      const { result } = renderHook(() => useUnitViewModel());
      await flushAsyncOperations();

      // Start editing the exact same record
      act(() => {
        result.current.startEdit({
          uuid: "edit-target-id",
          name: "Roll",
          singular: "Roll",
          plural: "Rolls",
          is_active: true,
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
});
