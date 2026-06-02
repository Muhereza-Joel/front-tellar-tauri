"use client";

import {
  Package,
  Tags,
  Badge,
  Ruler,
  SlidersHorizontal,
  Box,
  Boxes,
} from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";
import { useAuth } from "../context/AuthContext";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();

  const sidebarGroupsRaw = [
    {
      groupHeader: "Stock & Products",
      items: [
        {
          label: "Stock Overview",
          icon: <Package size={20} />,
          href: "/inventory",
          requiredPermission: "view_product",
        },
        {
          label: "Add Products",
          icon: <Box size={20} />,
          href: "/inventory/products",
          requiredPermission: "view_product",
        },
        {
          label: "Add Product Variants",
          icon: <Boxes size={20} />,
          href: "/inventory/variants",
          requiredPermission: "view_variants",
        },
      ],
    },

    {
      groupHeader: "Inventory Configuration",
      items: [
        {
          label: "Product Attributes",
          icon: <SlidersHorizontal size={20} />,
          href: "/inventory/attributes",
          requiredPermission: "view_attributes",
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
      ],
    },
  ];

  // Map and filter internal items within each segment
  const filteredItems = sidebarGroupsRaw.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.requiredPermission) return true;
      return hasPermission(item.requiredPermission);
    }),
  }));

  return (
    <ModuleLayout title="INVENTORY MODULE" items={filteredItems}>
      {children}
    </ModuleLayout>
  );
}
