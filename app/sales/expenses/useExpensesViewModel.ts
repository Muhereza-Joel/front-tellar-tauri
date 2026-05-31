"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { expenses } from "../../../db/schemas/expenses";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

const expenseSchema = yup.object({
  title: yup.string().required("Expense item designation title is required"),
  category: yup
    .string()
    .oneOf([
      "OPEX",
      "COGS",
      "MARKETING",
      "PAYROLL",
      "CAPEX",
      "TAX",
      "UTILITIES",
      "GENERAL",
    ])
    .required("Category taxonomy selection required"),
  amount: yup
    .number()
    .typeError("Disbursement scale must be a number")
    .positive("Disbursement value must be greater than zero")
    .required("Financial outflow amount required"),
  expenseDate: yup
    .string()
    .required("Transaction record date validation required"),
  paymentMethod: yup
    .string()
    .oneOf(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CREDIT"])
    .required(),
  vendor: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  notes: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

export function useExpensesViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [rawExpensesList, setRawExpensesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    category: "GENERAL" as any,
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH" as any,
    vendor: "",
    notes: "",
  });

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount,
    searchTerm,
    setSearchTerm,
  } = usePagination({
    data: rawExpensesList,
    initialPageSize: 10,
    searchKeys: ["title", "category", "vendor", "notes"],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.expenses.findMany({
        where: (e: any, { isNull }: any) => isNull(e.deleted_at),
        orderBy: (e: any, { desc }: any) => desc(e.expenseDate),
      });
      setRawExpensesList(results);
    } catch (err) {
      console.error("Local SQLite ledger read trace failed:", err);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  useEffect(() => {
    if (db) loadData();
  }, [db]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const valid = await expenseSchema.validate(
        {
          ...formData,
          amount: formData.amount === "" ? undefined : Number(formData.amount),
        },
        { abortEarly: false },
      );

      if (editingUuid) {
        await db
          .update(expenses)
          .set({
            title: valid.title,
            category: valid.category,
            amount: valid.amount,
            expenseDate: valid.expenseDate,
            paymentMethod: valid.paymentMethod,
            vendor: valid.vendor,
            notes: valid.notes,
            sync_status: "updated",
            updated_at: new Date().toISOString(),
          })
          .where(eq(expenses.uuid, editingUuid));
      } else {
        await db.insert(expenses).values({
          uuid: uuidv7(),
          tenantId: getTenantId(),
          title: valid.title,
          category: valid.category,
          amount: valid.amount,
          expenseDate: valid.expenseDate,
          paymentMethod: valid.paymentMethod,
          vendor: valid.vendor,
          notes: valid.notes,
          isActive: true,
          sync_status: "created",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      resetForm();
      loadData();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const mappedErrors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) mappedErrors[e.path] = e.message;
        });
        setErrors(mappedErrors);
      }
    }
  };

  const deleteExpense = async (uuid: string) => {
    if (!db) return;
    try {
      await db
        .update(expenses)
        .set({
          deleted_at: new Date().toISOString(),
          sync_status: "deleted",
        })
        .where(eq(expenses.uuid, uuid));
      loadData();
    } catch (err) {
      console.error("Failed marking ledger criteria record as deleted:", err);
    }
  };

  const startEdit = (expense: any) => {
    setEditingUuid(expense.uuid);
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      expenseDate: expense.expenseDate,
      paymentMethod: expense.paymentMethod,
      vendor: expense.vendor || "",
      notes: expense.notes || "",
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      title: "",
      category: "GENERAL",
      amount: "",
      expenseDate: new Date().toISOString().split("T")[0],
      paymentMethod: "CASH",
      vendor: "",
      notes: "",
    });
    setErrors({});
  };

  // Summation compute block matching layout tracking metrics requirements
  const totalOutflowSum = rawExpensesList.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  return {
    expensesList: paginatedData,
    totalOutflowSum,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleSave,
    deleteExpense,
    startEdit,
    resetForm,
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    setCurrentPage,
    setPageSize,
    searchTerm,
    setSearchTerm,
  };
}
