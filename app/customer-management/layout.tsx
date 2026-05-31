"use client";

import { SlidersHorizontal, Users, Wrench } from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";

export default function CustomerManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Configured with a proper group name to support your updated ModuleLayout
  const sidebarItems = [
    {
      groupHeader: "Customers & Services",
      items: [
        {
          label: "Customer Registry",
          icon: <Users size={20} />,
          href: "/customer-management",
        },
        {
          label: "Service Listing",
          icon: <Wrench size={20} />,
          href: "/customer-management/services",
        },
        {
          label: "Service Variants",
          icon: <SlidersHorizontal size={20} />,
          href: "/customer-management/servicevariants",
        },
      ],
    },
  ];

  return (
    <ModuleLayout title="CUSTOMERS MODULE" items={sidebarItems}>
      {children}
    </ModuleLayout>
  );
}
