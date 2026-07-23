"use client";

import { AuthProvider } from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Footer />
      <LoginModal />
    </AuthProvider>
  );
}
