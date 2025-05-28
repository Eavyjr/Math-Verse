
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google'; // Using Inter and Fira Code as Geist was causing issues
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer'; // Ensure this import is correct
// import { AuthProvider } from '@/context/auth-context'; // AuthProvider is currently commented out
import { Toaster } from '@/components/ui/toaster'; // Re-enable Toaster
import { Analytics } from "@vercel/analytics/next"; // Re-enable Vercel Analytics
import "katex/dist/katex.min.css"; // Import KaTeX CSS globally

const inter = Inter({
  variable: '--font-geist-sans', // Keeping variable name for consistency if CSS relies on it
  subsets: ['latin'],
});

const firaCode = Fira_Code({
  variable: '--font-geist-mono', // Keeping variable name for consistency
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
        {/* KaTeX CSS is imported via globals.css or directly above */}
        <script src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>
      </head>
      <body className={`${inter.variable} ${firaCode.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        {/* <AuthProvider> */} {/* AuthProvider remains commented out as per last instruction */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer /> {/* Ensure Footer is rendered here */}
          <Toaster /> {/* Render Toaster for notifications */}
        {/* </AuthProvider> */}
        <Analytics /> {/* Render Vercel Analytics */}
      </body>
    </html>
  );
}
