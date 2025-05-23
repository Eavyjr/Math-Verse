
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
// import { Toaster } from "@/components/ui/toaster"; // Toaster remains commented out
import "katex/dist/katex.min.css"; // KaTeX CSS
// import { Analytics } from "@vercel/analytics/next"; // Vercel Analytics remains commented out
import { AuthProvider } from '@/context/auth-context'; // Import AuthProvider
import { Toaster } from '@/components/ui/toaster'; // Import Toaster for Auth notifications

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const firaCode = Fira_Code({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
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
        <AuthProvider> {/* Wrap with AuthProvider */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <Toaster /> {/* Add Toaster here for app-wide notifications */}
        </AuthProvider>
        {/* <Analytics /> */} {/* Vercel Analytics remains commented out */}
      </body>
    </html>
  );
}
