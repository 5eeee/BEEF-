"use client";

import { AuthProvider } from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { UiPrefsProvider } from "@/components/UiPrefs";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <UiPrefsProvider>
      <AuthProvider>
        {children}
        <Footer />
        <LoginModal />
      </AuthProvider>
    </UiPrefsProvider>
  );
}
