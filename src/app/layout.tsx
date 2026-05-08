import "./globals.css";
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
      </head>
      <body className="bg-black text-zinc-100 min-h-screen font-sans antialiased selection:bg-[#EAB308]/30 overflow-x-hidden overflow-y-auto flex">
        <AppProvider>
          <CriticalDataProvider>
            <AuthProvider>
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
                                          <AuthWrapper>{children}</AuthWrapper>
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
            </AuthProvider>
          </CriticalDataProvider>
        </AppProvider>
      </body>
    </html>
  );
}
