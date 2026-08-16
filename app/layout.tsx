import type { Metadata } from 'next';
import { Montserrat, Merriweather, Source_Code_Pro } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const fontSans = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Merriweather({
  subsets: ['latin'],
  variable: '--font-serif',
});

const fontMono = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'SIMKAT',
  description: 'Sistem Katering untuk memantau Snapshot dan juga Production',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <NextTopLoader
          color='var(--primary)'
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing='ease'
          speed={200}
          shadow='0 0 10px var(--primary),0 0 5px var(--primary)'
        />
        {children}
        <Toaster position='top-right' duration={5000} />
      </body>
    </html>
  );
}
