"use client";

import { Truck, ShoppingCart } from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";
import { useAuth } from "../context/AuthContext";

export default function ProcurementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();

  const sidebarGroupsRaw = [
    {
      groupHeader: "Procurement",
      items: [
        {
          label: "Purchase Orders",
          icon: <ShoppingCart size={20} />,
          href: "/procurement/purchases",
          requiredPermission: "view_purchases",
        },
        {
          label: "Your Suppliers",
          icon: <Truck size={20} />,
          href: "/procurement/suppliers",
          requiredPermission: "view_suppliers",
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
    <ModuleLayout title="PROCUREMENT MODULE" items={filteredItems}>
      {children}
    </ModuleLayout>
  );
}
