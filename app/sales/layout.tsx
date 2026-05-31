"use client";

import ModuleLayout from "../components/ModuleLayout";
import {
  ShoppingCart,
  History,
  Tag,
  BookAIcon,
  Wallet,
  PieChart,
} from "lucide-react";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarItems = [
    {
      groupHeader: "Product Sales",
      items: [
        {
          label: "New Product Sale",
          icon: <ShoppingCart size={20} />,
          href: "/sales",
        },
        {
          label: "Product Sales History",
          icon: <History size={20} />,
          href: "/sales/history",
        },
      ],
    },
    {
      groupHeader: "Service Sales",
      items: [
        {
          label: "New Service Sale",
          icon: <ShoppingCart size={20} />,
          href: "/sales/sale-service",
        },
        {
          label: "Service Sales History",
          icon: <History size={20} />,
          href: "/sales/sale-service-history",
        },
      ],
    },
    {
      groupHeader: "Spendings",
      items: [
        {
          label: "Expenses",
          icon: <Wallet size={20} />,
          href: "/sales/expenses",
        },
      ],
    },
    {
      groupHeader: "Management",
      items: [
        {
          label: "Discounts",
          icon: <Tag size={20} />,
          href: "/sales/discounts",
        },
        {
          label: "Notes",
          icon: <BookAIcon size={20} />,
          href: "/sales/notes",
        },
        {
          label: "Reports",
          icon: <PieChart size={20} />,
          href: "/sales/reports",
        },
      ],
    },
  ];

  return (
    <ModuleLayout title="SALES MODULE" items={sidebarItems}>
      {children}
    </ModuleLayout>
  );
}
