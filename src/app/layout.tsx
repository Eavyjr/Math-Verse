
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster";
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
        {/* KaTeX CSS */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css" integrity="sha384-wcIxkf4k55AIftZWx+8xNo1r7BgnzGQMviewModelAI45NLC9ttKhpZBtfwL5INSmVLPGIaC_uYV" crossOrigin="anonymous" />
        
        {/* KaTeX JS and auto-render extension */}
        {/* The auto-render script makes `window.renderMathInElement` available */}
        <Script strategy="afterInteractive" src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js" integrity="sha384-hIoBPJpTUs74ddyc4bFZSMAGaAUcwLcGtoCUoMiIHGApghrJLGqIuyP_z1a4Z6Q==" crossOrigin="anonymous" defer></Script>
        <Script strategy="afterInteractive" src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js" integrity="sha384-43gdt9sVRmW1vCRHR7GMDXg/b_Hh28eYwGxdVjH2+80lS3f2L4GofP1Kk2aHBE/L" crossOrigin="anonymous" defer></Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
