import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cre-portal.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CRE Management Portal | Wisdom Islamic Students Organization',
    template: '%s | CRE Management Portal',
  },
  description: 'Continuing Religious Education (CRE) management portal conducted by Wisdom Islamic Students Organization in Kerala. Systematic, authentic Islamic education alongside secular schooling.',
  applicationName: 'CRE Management Portal',
  authors: [{ name: 'Wisdom Islamic Students Organization' }],
  generator: 'Next.js',
  keywords: [
    'CRE',
    'Continuing Religious Education',
    'Wisdom Islamic Students Organization',
    'Kerala Islamic Education',
    'Madrasa higher education',
    'CRE portal',
  ],
  icons: {
    icon: '/cre-logo.png',
    apple: '/cre-logo.png',
  },
  openGraph: {
    title: 'CRE Management Portal | Wisdom Islamic Students Organization',
    description: 'Continuing Religious Education (CRE) structured educational portal conducted by Wisdom Islamic Students Organization in Kerala.',
    url: siteUrl,
    siteName: 'CRE Management Portal',
    images: [
      {
        url: '/cre-logo.png',
        width: 600,
        height: 250,
        alt: 'CRE Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'CRE Management Portal | Wisdom Islamic Students Organization',
    description: 'Continuing Religious Education (CRE) structured educational portal conducted by Wisdom Islamic Students Organization in Kerala.',
    images: ['/cre-logo.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full bg-[#f7f9fc] ${montserrat.className}`}>
      <body className="h-full flex flex-col font-sans text-slate-800 antialiased selection:bg-cre-green selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
