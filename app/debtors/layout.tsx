"use client";

import { Receipt, HandCoins } from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";
import { useAuth } from "../context/AuthContext";

export default function DebtorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();

  const sidebarGroupsRaw = [
    {
      groupHeader: "Debtors",
      items: [
        {
          label: "Product Sales Debts",
          icon: <Receipt size={20} />,
          href: "/debtors",
          requiredPermission: "view_purchases",
        },
        {
          label: "Service Sales Debts",
          icon: <HandCoins size={20} />,
          href: "/debtors/services",
          requiredPermission: "view_purchases",
        },
      ],
    },
  ];

  const filteredItems = sidebarGroupsRaw.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.requiredPermission) return true;
      return hasPermission(item.requiredPermission);
    }),
  }));

  return (
    <ModuleLayout title="DEBTORS MODULE" items={filteredItems}>
      {children}
    </ModuleLayout>
  );
}
