
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { AuthProvider } from '@/context/auth-context'; 
import { Toaster } from '@/components/ui/toaster'; 
import FloatingChatbotButton from '@/components/chatbot/floating-chatbot-button';

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
        {/* KaTeX CSS */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossOrigin="anonymous" />
        
        {/* KaTeX JS Core */}
        <Script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmFGEkkP2" crossOrigin="anonymous" strategy="afterInteractive" />
        
        {/* KaTeX Auto-render extension */}
        <Script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" integrity="sha384-+VBxd3r6XgURycqtZ117nYw44SU3AYYGpArKGYrSqsTnJ5TTd3FSEE5ADZslDxXm" crossOrigin="anonymous" strategy="afterInteractive" />

        {/* Inline script to trigger rendering after scripts are loaded */}
        <Script id="katex-render" strategy="afterInteractive">
          {`
            document.addEventListener("DOMContentLoaded", function() {
              if (window.renderMathInElement) {
                window.renderMathInElement(document.body, {
                  delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\\\[', right: '\\\\]', display: true},
                    {left: '\\\\(', right: '\\\\)', display: false}
                  ]
                });
              }
            });
          `}
        </Script>
        
        {/* Desmos API script */}
      </head>
      <body className={`${inter.variable} ${firaCode.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <AuthProvider>
          <div className="page-loading-bar" />
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <Toaster /> 
          <FloatingChatbotButton />
        </AuthProvider>
        <Script 
          src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6" 
          strategy="lazyOnload" 
        />
      </body>
    </html>
  );
}
