"use client";

import { Users, Shield, KeyRound } from "lucide-react";
import ModuleLayout from "../components/ModuleLayout";
import { useAuth } from "../../app/context/AuthContext";

export default function UserManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();

  // Define navigation with permission requirements
  const sidebarItemsRaw = [
    {
      label: "User Accounts",
      icon: <Users size={20} />,
      href: "/user-management",
      requiredPermission: "view_user", // or "manage_users"
    },
    {
      label: "User Roles",
      icon: <Shield size={20} />,
      href: "/user-management/roles",
      requiredPermission: "view_role",
    },
    {
      label: "Permissions",
      icon: <KeyRound size={20} />,
      href: "/user-management/permissions",
      requiredPermission: "view_permission",
    },
  ];

  // Filter items based on permissions
  const sidebarItems = sidebarItemsRaw.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  return (
    <ModuleLayout title="Authorization Settings" items={sidebarItems}>
      {children}
    </ModuleLayout>
  );
}
