
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import Script from 'next/script'; // Added import for next/script
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { AuthProvider } from '@/context/auth-context'; 
import { Toaster } from '@/components/ui/toaster'; 
import FloatingChatbotButton from '@/components/chatbot/floating-chatbot-button';
import KatexLoader from '@/components/layout/katex-loader';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const firaCode = Fira_Code({
  variable: '--font-fira-code',
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
        {/* Static KaTeX CSS */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossOrigin="anonymous" />
        
        {/* Desmos API script using next/script */}
        {/* The API key dcb31709b452b1cf9dc26972add0fda6 seems to be a public/test key for Desmos API examples */}
      </head>
      <body className={`${inter.variable} ${firaCode.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <AuthProvider>
          <div className="page-loading-bar" /> {/* Added page loading bar */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <Toaster /> 
          <FloatingChatbotButton />
          <KatexLoader /> 
        </AuthProvider>
        <Script 
          src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6" 
          strategy="afterInteractive" 
        />
      </body>
    </html>
  );
}
