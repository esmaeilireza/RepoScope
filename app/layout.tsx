import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://reposcope.vercel.app'),
  title: {
    default: 'RepoScope 🛡️ — DataOps & Industrial Code Quality Gatekeeper',
    template: '%s | RepoScope',
  },
  description: 'Automated repository health audits with specialized profiles for DataOps, IIoT/PLC, and Web Apps. Detects broken links, missing CI/CD, security anomalies, and generates CycloneDX SBOM.',
  keywords: [
    'github-actions', 'devops', 'dataops', 'iiot', 'scada', 'plc',
    'code-quality', 'repository-audit', 'security-audit', 'sbom',
    'cyclonedx', 'nextjs', 'typescript',
  ],
  authors: [
    { name: 'Reza Esmaeili', url: 'https://github.com/esmaeilireza' },
    { name: 'Abbas Lotfi', url: 'https://github.com/abbas-pt' },
  ],
  creator: 'Reza Esmaeili',
  openGraph: {
    title: 'RepoScope 🛡️ — DataOps & Industrial Code Quality Gatekeeper',
    description: 'Automated repository health audits with specialized profiles for DataOps, IIoT/PLC, and Web Apps.',
    url: 'https://reposcope.vercel.app',
    siteName: 'RepoScope',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RepoScope — DataOps & Industrial Code Quality Gatekeeper',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepoScope 🛡️ — DataOps & Industrial Code Quality Gatekeeper',
    description: 'Automated repository health audits for DataOps, IIoT, and Web Apps.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-night text-white antialiased">
        {children}
      </body>
    </html>
  );
}