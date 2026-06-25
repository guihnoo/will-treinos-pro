import "./globals.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { CriticalDataProvider } from "@/context/CriticalDataContext";
import { AuthProvider } from "@/context/AuthContext";
import { CalendarTickProvider } from "@/context/CalendarTickContext";
import { StudentsProvider } from "@/context/StudentsContext";
import { LessonsProvider } from "@/context/LessonsContext";
import { PaymentsProvider } from "@/context/PaymentsContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { AppConfigProvider } from "@/context/AppConfigContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CoachingProvider } from "@/context/CoachingContext";
import { FeedProvider } from "@/context/FeedContext";
import { CheckInProvider } from "@/context/CheckInContext";
import { LessonRatingsProvider } from "@/context/LessonRatingsContext";
import { TrainingProvider } from "@/context/TrainingContext";
import { GamificationProvider } from "@/context/GamificationContext";
import { MotionProvider } from "@/components/MotionProvider";
import AuthWrapper from "@/components/AuthWrapper";
import { ToastProvider } from "@/components/Toast";
import { RichToastProvider } from "@/components/ui/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getPublicAppUrl } from "@/lib/appUrl";

const appUrl = getPublicAppUrl();

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Will Treinos PRO — Vôlei de Alta Performance",
    template: "%s | Will Treinos PRO",
  },
  description: "A plataforma de gestão e gamificação para vôlei de alta performance. Avaliação técnica por fundamento, XP, tiers e acompanhamento em tempo real.",
  keywords: ["vôlei", "treino", "performance", "gamificação", "esporte", "avaliação técnica"],
  authors: [{ name: "Will Treinos PRO" }],
  creator: "Will Treinos PRO",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: appUrl,
    siteName: "Will Treinos PRO",
    title: "Will Treinos PRO — Vôlei de Alta Performance",
    description: "Plataforma exclusiva de gestão e gamificação para vôlei. Evolua de Iniciante a Elite.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Will Treinos PRO" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Will Treinos PRO — Vôlei de Alta Performance",
    description: "Plataforma exclusiva de gamificação para vôlei de alta performance.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="WillPRO" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* iOS splash screens — portrait, common iPhone sizes */}
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/icons/apple-touch-icon.png" />
        {/* Preconnect para domínios externos */}
        <link rel="preconnect" href="https://api.dicebear.com" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} bg-black text-zinc-100 min-h-screen font-sans antialiased selection:bg-[#EAB308]/30 overflow-x-hidden overflow-y-auto flex`}>
        <ErrorBoundary>
        <MotionProvider>
        <AppProvider>
            <AuthProvider>
              <CriticalDataProvider>
              <CalendarTickProvider>
                <StudentsProvider>
                  <LessonsProvider>
                    <PaymentsProvider>
                      <NotificationsProvider>
                        <AppConfigProvider>
                          <CatalogProvider>
                            <CoachingProvider>
                              <FeedProvider>
                                <CheckInProvider>
                                  <TrainingProvider>
                                    <GamificationProvider>
                                      <LessonRatingsProvider>
                                        <ToastProvider>
                                          <RichToastProvider>
                                            <AuthWrapper>{children}</AuthWrapper>
                                          </RichToastProvider>
                                        </ToastProvider>
                                      </LessonRatingsProvider>
                                    </GamificationProvider>
                                  </TrainingProvider>
                                </CheckInProvider>
                              </FeedProvider>
                            </CoachingProvider>
                          </CatalogProvider>
                        </AppConfigProvider>
                      </NotificationsProvider>
                    </PaymentsProvider>
                  </LessonsProvider>
                </StudentsProvider>
              </CalendarTickProvider>
              </CriticalDataProvider>
            </AuthProvider>
        </AppProvider>
        </MotionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
