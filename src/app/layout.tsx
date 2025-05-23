
import type { Metadata } from 'next';
// import { Geist_Sans as GeistSans, Geist_Mono as GeistMono } from 'next/font/google'; // Temporarily commented out
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
// import { Toaster } from "@/components/ui/toaster"; // Temporarily commented out
// Import KaTeX CSS directly
import "katex/dist/katex.min.css";
// import { Analytics } from "@vercel/analytics/next"; // Temporarily commented out

/* // Temporarily commented out
const geistSans = GeistSans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
*/

export const metadata: Metadata = {
  title: 'MathVerse',
  description: 'MathVerse: Your Universe for Mathematical Exploration and AI Assistance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* KaTeX CSS is imported via JS above */}
      </head>
      {/* <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}> */}
      <body className={`antialiased flex flex-col min-h-screen bg-background text-foreground`}> {/* Temporarily remove font variables */}
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
        {/* <Toaster /> */} {/* Temporarily commented out */}
        {/* <Analytics /> */} {/* Temporarily commented out */}
      </body>
    </html>
  );
}
