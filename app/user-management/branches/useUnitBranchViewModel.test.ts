import { renderHook, act } from "@testing-library/react";
import { useBranchViewModel } from "./useBranchViewModel";
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
  v7: () => "mocked-branch-uuid-v7",
}));

// Mock the custom notification hook completely to prevent native Tauri binary crashes
jest.mock("../../hooks/useNotification", () => ({
  useNotification: () => ({
    success: jest.fn(),
    error: jest.fn(), // If you assert on this mock, change this to your shared mock variable
  }),
}));

describe("useBranchViewModel Hook", () => {
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
        branches: {
          findMany: mockFindMany,
        },
      },
      insert: mockInsert,
      update: mockUpdate,
    };

    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
    (useAuth as jest.Mock).mockReturnValue({
      getTenantId: () => "tenant-abc-123",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper utility to safely step over microtasks and loading timeouts
  const flushAsyncOperations = async () => {
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
  };

  it("should initialize with default states and load branch records on mount", async () => {
    mockFindMany.mockResolvedValue([
      {
        uuid: "branch-1",
        name: "Main Headquarters",
        email: "hq@company.com",
        is_main: true,
        is_active: true,
      },
    ]);

    const { result } = renderHook(() => useBranchViewModel());

    expect(result.current.loading).toBe(true);
    expect(result.current.formData.name).toBe("");

    await flushAsyncOperations();

    expect(result.current.loading).toBe(false);
    expect(mockFindMany).toHaveBeenCalled();
    expect(result.current.branchesList.length).toBe(1);
    expect(result.current.branchesList[0].name).toBe("Main Headquarters");
  });

  it("should track field changes correctly via setFormData or custom state hooks", async () => {
    const { result } = renderHook(() => useBranchViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.setFormData((prev: any) => ({
        ...prev,
        name: "North Branch",
        email: "north@company.com",
        phone: "+256700000000",
        address: "123 Street Rd",
        city: "Kampala",
        country: "Uganda",
        is_main: false,
        is_active: true,
      }));
    });

    expect(result.current.formData.name).toBe("North Branch");
    expect(result.current.formData.email).toBe("north@company.com");
    expect(result.current.formData.city).toBe("Kampala");
  });

  it("should fail validation and populate error structures if required details are missing", async () => {
    const { result } = renderHook(() => useBranchViewModel());
    await flushAsyncOperations();

    const mockEvent = { preventDefault: jest.fn() } as any;

    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.name).toBe("Branch name is required");
  });

  it("should fail validation if an invalid email string format is provided", async () => {
    const { result } = renderHook(() => useBranchViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.setFormData((prev: any) => ({
        ...prev,
        name: "Westside Branch",
        email: "not-a-valid-email",
      }));
    });

    const mockEvent = { preventDefault: jest.fn() } as any;

    await act(async () => {
      await result.current.handleSave(mockEvent);
    });

    expect(result.current.errors.email).toBe("Invalid email");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("should insert a new branch record accurately upon valid form compliance submission", async () => {
    const { result } = renderHook(() => useBranchViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.setFormData({
        name: "Mombasa Outlet",
        email: "mombasa@company.com",
        phone: "0711223344",
        address: "Beach Road",
        city: "Mombasa",
        country: "Kenya",
        notes: "Primary coastal hub",
        is_main: false,
        is_active: true,
      });
    });

    const mockEvent = { preventDefault: jest.fn() } as any;

    await act(async () => {
      await result.current.handleSave(mockEvent);
    });
    await flushAsyncOperations();

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: "mocked-branch-uuid-v7",
        name: "Mombasa Outlet",
        tenant_id: "tenant-abc-123",
        sync_status: "created",
      }),
    );

    // Form should reset smoothly back to default schema structures
    expect(result.current.formData.name).toBe("");
    expect(result.current.editingUuid).toBeNull();
  });

  it("should populate the local form state configurations and save modifications on edit tracking mode", async () => {
    const { result } = renderHook(() => useBranchViewModel());
    await flushAsyncOperations();

    const existingBranch = {
      uuid: "branch-uuid-999",
      name: "Industrial Area Hub",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      notes: "",
      is_main: true,
      is_active: true,
    };

    act(() => {
      result.current.startEdit(existingBranch);
    });

    expect(result.current.editingUuid).toBe("branch-uuid-999");
    expect(result.current.formData.name).toBe("Industrial Area Hub");

    // Modify the loaded name value
    act(() => {
      result.current.setFormData((prev: any) => ({
        ...prev,
        name: "Industrial Area Hub - Updated",
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
        name: "Industrial Area Hub - Updated",
        sync_status: "updated",
      }),
    );
    expect(result.current.editingUuid).toBeNull();
  });

  it("should register a safe soft deletion sequence pattern when executing deleteBranch", async () => {
    const { result } = renderHook(() => useBranchViewModel());
    await flushAsyncOperations();

    await act(async () => {
      await result.current.deleteBranch("delete-target-uuid");
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

  it("should fully restore form state primitives back to clean setups upon executing resetForm", async () => {
    const { result } = renderHook(() => useBranchViewModel());
    await flushAsyncOperations();

    act(() => {
      result.current.startEdit({
        uuid: "some-arbitrary-uuid",
        name: "Temporary Storefront",
        is_main: false,
        is_active: true,
      });
    });

    expect(result.current.editingUuid).toBe("some-arbitrary-uuid");

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.editingUuid).toBeNull();
    expect(result.current.formData.name).toBe("");
  });

  describe("Branches Pagination & Filtering Runtime Layers", () => {
    it("should accurately trim branch rows based on matching search terms", async () => {
      mockFindMany.mockResolvedValue([
        { uuid: "b1", name: "Entebbe Airfield Shop", city: "Entebbe" },
        { uuid: "b2", name: "Jinja Highway Store", city: "Jinja" },
      ]);

      const { result } = renderHook(() => useBranchViewModel());
      await flushAsyncOperations();

      expect(result.current.branchesList.length).toBe(2);

      act(() => {
        result.current.setSearchTerm("Jinja");
      });

      expect(result.current.branchesList.length).toBe(1);
      expect(result.current.branchesList[0].name).toBe("Jinja Highway Store");
    });

    it("should force pagination state back to page index 1 when a lookahead search value shifts", async () => {
      const longBranchDataset = Array.from({ length: 15 }, (_, i) => ({
        uuid: `id-${i}`,
        name: `Branch Office ${i}`,
        city: "City",
      }));
      mockFindMany.mockResolvedValue(longBranchDataset);

      const { result } = renderHook(() => useBranchViewModel());
      await flushAsyncOperations();

      act(() => {
        result.current.setCurrentPage(2);
      });
      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.setSearchTerm("Office 10");
      });

      expect(result.current.currentPage).toBe(1);
    });

    it("should recalibrate page ranges if max boundary limits contract during page layout resizing", async () => {
      const longBranchDataset = Array.from({ length: 12 }, (_, i) => ({
        uuid: `id-${i}`,
        name: `Warehouse Unit ${i}`,
      }));
      mockFindMany.mockResolvedValue(longBranchDataset);

      const { result } = renderHook(() => useBranchViewModel());
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
  });

  describe("useBranchViewModel Hook - Duplicate Prevention System", () => {
    it("should block registration and raise an error if branch name matches case-insensitively", async () => {
      // 1. Pre-hydrate the database findMany dataset with an active branch row
      mockFindMany.mockResolvedValue([
        {
          uuid: "existing-branch-uuid",
          name: "  NAIROBI HQ ",
          city: "Nairobi",
          is_active: true,
          tenant_id: "tenant-abc-123",
        },
      ]);

      const { result } = renderHook(() => useBranchViewModel());
      await flushAsyncOperations(); // hydrate branchesList state

      // 2. Try inputting the duplicate name variant
      act(() => {
        result.current.setFormData((prev: any) => ({
          ...prev,
          name: "nairobi hq",
        }));
      });

      const mockEvent = { preventDefault: jest.fn() } as any;
      await act(async () => {
        await result.current.handleSave(mockEvent);
      });
      await flushAsyncOperations();

      // 3. Assert error state caught it instantly in-memory
      expect(result.current.errors.name).toBe(
        "A branch with this name already exists",
      );
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("should allow editing current entity name to be updated without matching self as duplicate", async () => {
      mockFindMany.mockResolvedValue([
        {
          uuid: "edit-branch-uuid",
          name: "Kampala Hub",
          city: "Kampala",
          is_active: true,
          tenant_id: "tenant-abc-123",
        },
      ]);

      const { result } = renderHook(() => useBranchViewModel());
      await flushAsyncOperations();

      // Enter edit mode
      act(() => {
        result.current.startEdit({
          uuid: "edit-branch-uuid",
          name: "Kampala Hub",
          city: "Kampala",
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

    it("should block creation if another branch is already assigned as the main headquarters", async () => {
      // Pre-hydrate internal state with an existing HQ branch record
      mockFindMany.mockResolvedValue([
        {
          uuid: "hq-branch-uuid",
          name: "Kampala Main HQ",
          is_main: true,
          is_active: true,
          tenant_id: "tenant-abc-123",
        },
      ]);

      const { result } = renderHook(() => useBranchViewModel());
      await flushAsyncOperations(); // hydrations layer run

      // Attempt to register a second main headquarters branch
      act(() => {
        result.current.setFormData((prev: any) => ({
          ...prev,
          name: "Mombasa Outlet HQ",
          is_main: true,
        }));
      });

      const mockEvent = { preventDefault: jest.fn() } as any;
      await act(async () => {
        await result.current.handleSave(mockEvent);
      });
      await flushAsyncOperations();

      // Assert validation stops processing before hitting DB insertion
      expect(result.current.errors.is_main).toBe(
        "A main headquarters branch already exists for this tenant",
      );
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("should allow editing a main headquarters branch without triggering self-conflict validation", async () => {
      mockFindMany.mockResolvedValue([
        {
          uuid: "hq-branch-uuid",
          name: "Kampala Main HQ",
          is_main: true,
          is_active: true,
          tenant_id: "tenant-abc-123",
        },
      ]);

      const { result } = renderHook(() => useBranchViewModel());
      await flushAsyncOperations();

      // Start editing the actual headquarters record
      act(() => {
        result.current.startEdit({
          uuid: "hq-branch-uuid",
          name: "Kampala Main HQ",
          is_main: true,
        });
      });

      // Update name variation field details but leave is_main checked
      act(() => {
        result.current.setFormData((prev: any) => ({
          ...prev,
          name: "Kampala Main HQ - Updated",
        }));
      });

      const mockEvent = { preventDefault: jest.fn() } as any;
      await act(async () => {
        await result.current.handleSave(mockEvent);
      });
      await flushAsyncOperations();

      expect(result.current.errors.is_main).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
