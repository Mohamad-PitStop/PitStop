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
  variable: "--font-raleway",
  display: "swap",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pitstop-diagnostic.live').replace(/\/$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PitStop : diagnostic et estimation auto en Belgique',
    template: '%s | PitStop',
  },
  description: 'Diagnostic auto par IA et estimation des coûts de réparation en Belgique. Comparez les prix DIY ou garage et prenez rendez-vous avec un partenaire de confiance.',
  applicationName: 'PitStop',
  generator: 'v0.app',
  keywords: [
    'diagnostic auto',
    'estimation réparation voiture',
    'devis garage Belgique',
    'panne automobile',
    'voyant moteur',
    'PitStop',
  ],
  authors: [{ name: 'PitStop' }],
  creator: 'PitStop',
  publisher: 'PitStop',
  alternates: {
    canonical: '/',
    languages: {
      'fr-BE': '/',
      'en': '/',
      'nl-BE': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_BE',
    alternateLocale: ['en_US', 'nl_BE'],
    url: SITE_URL,
    siteName: 'PitStop',
    title: 'PitStop : diagnostic et estimation auto en Belgique',
    description: 'Estimez vos réparations et la valeur de revente de votre véhicule en quelques secondes. 1er diagnostic offert, garages partenaires partout en Belgique.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PitStop : diagnostic et estimation auto en Belgique',
    description: 'Estimez vos réparations et la valeur de revente de votre véhicule en quelques secondes. 1er diagnostic offert, garages partenaires partout en Belgique.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/icon.png',
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
