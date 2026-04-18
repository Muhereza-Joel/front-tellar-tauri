"use client";

import ModuleLayout from "../components/ModuleLayout";
import { ShoppingCart, History, Tag } from "lucide-react";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarItems = [
    { label: "New Sale", icon: <ShoppingCart size={20} />, href: "/sales" },
    {
      label: "Transaction History",
      icon: <History size={20} />,
      href: "/sales/history",
    },
    { label: "Discounts", icon: <Tag size={20} />, href: "/sales/discounts" },
  ];

  return (
    <ModuleLayout title="Sales Management" items={sidebarItems}>
      {children}
    </ModuleLayout>
  );
}
