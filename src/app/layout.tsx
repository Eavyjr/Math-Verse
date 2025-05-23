
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google'; // Changed from Geist_Sans and Geist_Mono
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
// import { Toaster } from "@/components/ui/toaster"; // Toaster remains commented out
import "katex/dist/katex.min.css";
// import { Analytics } from "@vercel/analytics/next"; // Analytics remains commented out

// Initialize Inter font
const inter = Inter({
  variable: '--font-geist-sans', // Keeping CSS variable name for simplicity
  subsets: ['latin'],
});

// Initialize Fira Code font
const firaCode = Fira_Code({
  variable: '--font-geist-mono', // Keeping CSS variable name for simplicity
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Fira Code often requires specific weights
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
        {/* KaTeX CSS imported via JS style import */}
      </head>
      <body className={`${inter.variable} ${firaCode.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
        {/* <Toaster /> */} {/* Toaster remains commented out */}
        {/* <Analytics /> */} {/* Analytics remains commented out */}
      </body>
    </html>
  );
}
