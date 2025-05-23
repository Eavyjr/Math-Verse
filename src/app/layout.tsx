
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import "katex/dist/katex.min.css"; // KaTeX CSS
// import { AuthProvider } from '@/context/auth-context'; // AuthProvider commented out
// import { Toaster } from '@/components/ui/toaster'; // Toaster commented out for now

const inter = Inter({
  variable: '--font-geist-sans', // Changed from --font-inter to match globals.css
  subsets: ['latin'],
});

const firaCode = Fira_Code({
  variable: '--font-geist-mono', // Changed from --font-fira-code to match globals.css
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
        {/* KaTeX CSS is imported directly in this file now */}
      </head>
      <body className={`${inter.variable} ${firaCode.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        {/* <AuthProvider> */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          {/* <Toaster /> */}
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}
