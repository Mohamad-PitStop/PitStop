import type { Metadata, Viewport } from 'next'
import { Raleway, Inter } from 'next/font/google'
import './globals.css'
import { CookieConsentBanner } from '@/components/cookie-consent-banner'
import { AnalyticsConsentGate } from '@/components/analytics-consent-gate'
import { CookiePreferencesDialog } from '@/components/cookie-preferences-dialog'
import { ResponsiveProvider } from '@/components/responsive-provider'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { PageTransition } from '@/components/page-transition'
import { Toaster } from '@/components/ui/sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'

const raleway = Raleway({ 
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-raleway"
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: 'PitStop - Estimez vos réparations auto',
  description: 'Obtenez une estimation fiable et transparente pour vos réparations automobiles. Comparez les prix DIY et garage.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0D1B3E',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${raleway.variable} ${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen`}>
        <ResponsiveProvider>
          <LocaleProvider>
            <PageTransition>{children}</PageTransition>
            <LanguageSwitcher variant="mobile" />
            <CookieConsentBanner />
            <CookiePreferencesDialog />
            <AnalyticsConsentGate />
            <Toaster position="bottom-right" richColors />
            <SpeedInsights />
          </LocaleProvider>
        </ResponsiveProvider>
      </body>
    </html>
  )
}
