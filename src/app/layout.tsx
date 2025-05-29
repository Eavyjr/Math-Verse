
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
// import { AuthProvider } from '@/context/auth-context'; // AuthProvider is currently commented out
import { Toaster } from '@/components/ui/toaster';
// import { Analytics } from "@vercel/analytics/next"; // Vercel Analytics currently commented out
import "katex/dist/katex.min.css"; // Import KaTeX CSS globally
import FloatingChatbotButton from '@/components/chatbot/floating-chatbot-button';

const inter = Inter({
  variable: '--font-inter', // Using Inter as Geist was causing issues
  subsets: ['latin'],
});

const firaCode = Fira_Code({
  variable: '--font-fira-code', // Using Fira Code as Geist Mono was causing issues
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
        {/* KaTeX CSS is imported directly above */}
        <script src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>
      </head>
      <body className={`${inter.variable} ${firaCode.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        {/* <AuthProvider> */} {/* AuthProvider remains commented out as per last instruction */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <Toaster /> {/* Render Toaster for notifications */}
          <FloatingChatbotButton /> {/* Add the floating chatbot button here */}
        {/* </AuthProvider> */}
        {/* <Analytics /> */} {/* Vercel Analytics currently commented out */}
      </body>
    </html>
  );
}
