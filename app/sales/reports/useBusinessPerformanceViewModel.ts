"use client";

import { useEffect, useState, useCallback } from "react";
import { getDatabase } from "../../../db";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
} from "date-fns";

export type FilterMode =
  | "PRESET"
  | "CUSTOM_DAY"
  | "CUSTOM_WEEK"
  | "CUSTOM_MONTH"
  | "CUSTOM_YEAR";
export type PresetKey =
  | "TODAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "THIS_QUARTER"
  | "THIS_YEAR"
  | "ALL";

export interface BusinessPerformanceMetrics {
  totalRevenue: number;
  directSalesRevenue: number;
  serviceSalesRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  expenseToRevenueRatio: number;
  expenseBreakdown: any[];
}

export function useBusinessPerformanceViewModel() {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter State
  const [filterMode, setFilterMode] = useState<FilterMode>("PRESET");
  const [preset, setPreset] = useState<PresetKey>("THIS_MONTH");
  const [customDate, setCustomDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const [metrics, setMetrics] = useState<BusinessPerformanceMetrics>({
    totalRevenue: 0,
    directSalesRevenue: 0,
    serviceSalesRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    expenseToRevenueRatio: 0,
    expenseBreakdown: [],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const computeMetrics = useCallback(async () => {
    if (!db) return;
    setLoading(true);

    try {
      const [directSales, serviceSales, expenses] = await Promise.all([
        db.query.sales.findMany({
          where: (s: any, { isNull, and, not, eq }: any) =>
            and(isNull(s.deleted_at), not(eq(s.status, "CANCELLED"))),
        }),
        db.query.serviceSales.findMany({
          where: (ss: any, { isNull, and, not, eq }: any) =>
            and(isNull(ss.deleted_at), not(eq(ss.status, "CANCELLED"))),
        }),
        db.query.expenses.findMany({
          where: (e: any, { isNull }: any) => isNull(e.deleted_at),
        }),
      ]);

      const now = new Date();
      let range: { start: Date; end: Date } | null = null;

      if (filterMode === "PRESET") {
        if (preset === "TODAY")
          range = { start: startOfDay(now), end: endOfDay(now) };
        else if (preset === "THIS_WEEK")
          range = { start: startOfWeek(now), end: endOfWeek(now) };
        else if (preset === "THIS_MONTH")
          range = { start: startOfMonth(now), end: endOfMonth(now) };
        else if (preset === "THIS_QUARTER") {
          const q = Math.floor(now.getMonth() / 3) * 3;
          range = {
            start: new Date(now.getFullYear(), q, 1),
            end: endOfMonth(new Date(now.getFullYear(), q + 2, 1)),
          };
        } else if (preset === "THIS_YEAR")
          range = { start: startOfYear(now), end: endOfYear(now) };
      } else {
        const selected = parseISO(customDate);
        if (filterMode === "CUSTOM_DAY")
          range = { start: startOfDay(selected), end: endOfDay(selected) };
        else if (filterMode === "CUSTOM_WEEK")
          range = { start: startOfWeek(selected), end: endOfWeek(selected) };
        else if (filterMode === "CUSTOM_MONTH")
          range = { start: startOfMonth(selected), end: endOfMonth(selected) };
        else if (filterMode === "CUSTOM_YEAR")
          range = { start: startOfYear(selected), end: endOfYear(selected) };
      }

      const filterFn = (dateStr: string) => {
        if (!range || !dateStr) return true;
        const d = new Date(dateStr);
        return d >= range.start && d <= range.end;
      };

      // Aggregations
      const revDirect = directSales
        .filter((r: any) => filterFn(r.created_at))
        .reduce(
          (sum: number, r: any) => sum + (Number(r.total_amount) || 0),
          0,
        );
      const revService = serviceSales
        .filter((r: any) => filterFn(r.created_at))
        .reduce(
          (sum: number, r: any) => sum + (Number(r.total_amount) || 0),
          0,
        );
      const filteredExp = expenses.filter((r: any) =>
        filterFn(r.expenseDate || r.created_at),
      );
      const totalExp = filteredExp.reduce(
        (sum: number, r: any) => sum + (Number(r.amount) || 0),
        0,
      );

      const totalRev = revDirect + revService;
      const net = totalRev - totalExp;

      const categoryMap: Record<string, number> = {};
      filteredExp.forEach((exp: any) => {
        const cat = exp.category || "GENERAL";
        categoryMap[cat] = (categoryMap[cat] || 0) + Number(exp.amount);
      });

      setMetrics({
        totalRevenue: totalRev,
        directSalesRevenue: revDirect,
        serviceSalesRevenue: revService,
        totalExpenses: totalExp,
        netProfit: net,
        profitMargin:
          totalRev > 0 ? parseFloat(((net / totalRev) * 100).toFixed(2)) : 0,
        expenseToRevenueRatio:
          totalRev > 0
            ? parseFloat(((totalExp / totalRev) * 100).toFixed(2))
            : 0,
        expenseBreakdown: Object.entries(categoryMap)
          .map(([category, total]) => ({
            category,
            total,
            percentage: totalExp > 0 ? (total / totalExp) * 100 : 0,
          }))
          .sort((a, b) => b.total - a.total),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [db, filterMode, preset, customDate]);

  useEffect(() => {
    computeMetrics();
  }, [computeMetrics]);

  return {
    metrics,
    loading,
    filterMode,
    setFilterMode,
    preset,
    setPreset,
    customDate,
    setCustomDate,
    refresh: computeMetrics,
  };
}
