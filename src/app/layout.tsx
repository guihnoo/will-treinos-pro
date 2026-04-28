import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import AuthWrapper from "@/components/AuthWrapper";
import { ToastProvider } from "@/components/Toast";

export const metadata = {
  title: "Will Treinos PRO",
  description: "Performance & Gestão Elite",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-black text-zinc-100 min-h-screen font-sans antialiased selection:bg-[#EAB308]/30 overflow-x-hidden overflow-y-auto flex">
        <AppProvider>
          <ToastProvider>
            <AuthWrapper>{children}</AuthWrapper>
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
