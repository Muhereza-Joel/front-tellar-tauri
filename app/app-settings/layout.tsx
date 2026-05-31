import {
  Settings,
  Printer,
  Monitor,
  Database,
  ShieldCheck,
} from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";

export default function UserManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarItems = [
    { label: "General", icon: <Settings size={20} />, href: "/app-settings" },
    {
      label: "Hardware",
      icon: <Printer size={20} />,
      href: "/app-settings/hardware",
    },
    {
      label: "Display",
      icon: <Monitor size={20} />,
      href: "/app-settings/display",
    },
    {
      label: "Database",
      icon: <Database size={20} />,
      href: "/app-settings/database",
    },
    {
      label: "Security",
      icon: <ShieldCheck size={20} />,
      href: "/app-settings/security",
    },
  ];

  return (
    <ModuleLayout title="SETTINGS MODULE" items={sidebarItems}>
      {children}
    </ModuleLayout>
  );
}
