import { SlidersHorizontal, Users, Wrench } from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Define navigation ONCE for the entire inventory module
  const sidebarItems = [
    {
      label: "Customer Registry",
      icon: <Users size={20} />,
      href: "/customer-management",
    },
    {
      label: "Services Registry",
      icon: <Wrench size={20} />,
      href: "/customer-management/services",
    },
    {
      label: "Service Variants",
      icon: <SlidersHorizontal size={20} />,
      href: "/customer-management/servicevariants",
    },
  ];

  return (
    <ModuleLayout title="Customer Management" items={sidebarItems}>
      {children}
    </ModuleLayout>
  );
}
