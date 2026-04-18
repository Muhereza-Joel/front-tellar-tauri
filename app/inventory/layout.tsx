"use client";

import {
  Package,
  Building2,
  Truck,
  Tags,
  Badge,
  Ruler,
  SlidersHorizontal,
  Box,
  Boxes,
  ShoppingCart,
} from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";
import { useAuth } from "../context/AuthContext";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();

  const sidebarItemsRaw = [
    {
      label: "Stock Registry",
      icon: <Package size={20} />,
      href: "/inventory",
      requiredPermission: "view_product",
    },
    {
      label: "Products",
      icon: <Box size={20} />,
      href: "/inventory/products",
      requiredPermission: "view_product",
    },
    {
      label: "Product Attributes",
      icon: <SlidersHorizontal size={20} />,
      href: "/inventory/attributes",
      requiredPermission: "view_attributes",
    },
    {
      label: "Product Variants",
      icon: <Boxes size={20} />,
      href: "/inventory/variants",
      requiredPermission: "view_variants",
    },
    {
      label: "Purchase Orders",
      icon: <ShoppingCart size={20} />,
      href: "/inventory/purchases",
      requiredPermission: "view_purchases",
    },
    {
      label: "Branches",
      icon: <Building2 size={20} />,
      href: "/inventory/branches",
      requiredPermission: "view_branch",
    },
    {
      label: "Suppliers",
      icon: <Truck size={20} />,
      href: "/inventory/suppliers",
      requiredPermission: "view_suppliers",
    },
    {
      label: "Categories",
      icon: <Tags size={20} />,
      href: "/inventory/categories",
      requiredPermission: "view_category",
    },
    {
      label: "Brands",
      icon: <Badge size={20} />,
      href: "/inventory/brands",
      requiredPermission: "view_brands",
    },
    {
      label: "Units Registry",
      icon: <Ruler size={20} />,
      href: "/inventory/setup",
      requiredPermission: "view_units",
    },
  ];

  // Filter items based on permissions
  const sidebarItems = sidebarItemsRaw.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  return (
    <ModuleLayout title="Inventory Management" items={sidebarItems}>
      {children}
    </ModuleLayout>
  );
}
