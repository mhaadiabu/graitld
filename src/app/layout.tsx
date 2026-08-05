import type { Metadata } from 'next';
import { Manrope, DM_Sans, JetBrains_Mono } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from '@/lib/product';
import { getToken } from '@/lib/auth-server';

import { ConvexClientProvider } from './ConvexClientProvider';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: PRODUCT_DESCRIPTION,
};

/**
 * App root layout that applies global fonts, provides theme context, and wraps pages with the Convex client.
 *
 * @param children - React nodes to render within the application's layout.
 * @returns The root `<html>` element containing a `<body>` with global font classes and providers that supply theme and Convex client context to `children`.
 */

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider initialToken={token}>{children}</ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
