import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { SyncTauriTheme } from "./components/SyncTauriTheme";
import AuthGuard from "./components/guards/AuthGuard";
import { AuthProvider } from "./context/AuthContext";
import { PermissionSyncInitializer } from "./components/PermissionSyncInitializer";
import LicenseGuard from "./components/LicenseGuard";
import { NotificationProvider } from "./context/NotificationContext";
import UpdateNotification from "./components/UpdateNotification";
import TimeGuard from "./components/guards/TimeGuard";

export const metadata: Metadata = {
  title: "FrontTela",
  description: "The best inventory and POS system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SyncTauriTheme />
          <NotificationProvider>
            <TimeGuard>
              <LicenseGuard>
                <AuthProvider>
                  <AuthGuard>{children}</AuthGuard>
                </AuthProvider>
              </LicenseGuard>
            </TimeGuard>
            <UpdateNotification />
          </NotificationProvider>
        </ThemeProvider>
        <PermissionSyncInitializer />
      </body>
    </html>
  );
}
