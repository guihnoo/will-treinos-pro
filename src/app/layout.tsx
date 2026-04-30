import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { StudentsProvider } from "@/context/StudentsContext";
import { LessonsProvider } from "@/context/LessonsContext";
import { PaymentsProvider } from "@/context/PaymentsContext";
import AuthWrapper from "@/components/AuthWrapper";
import { ToastProvider } from "@/components/Toast";

export const metadata = {
  title: "Will Treinos PRO",
  description: "Performance & Gestão Elite",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-black text-zinc-100 min-h-screen font-sans antialiased selection:bg-[#EAB308]/30 overflow-x-hidden overflow-y-auto flex">
        <AppProvider>
          <AuthProvider>
            <StudentsProvider>
              <LessonsProvider>
                <PaymentsProvider>
                  <ToastProvider>
                    <AuthWrapper>{children}</AuthWrapper>
                  </ToastProvider>
                </PaymentsProvider>
              </LessonsProvider>
            </StudentsProvider>
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  );
}
