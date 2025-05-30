
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { AuthProvider } from '@/context/auth-context'; // Re-enabled
import { Toaster } from '@/components/ui/toaster'; // Re-enabled
// import { Analytics } from "@vercel/analytics/next"; // Vercel Analytics currently commented out
import "katex/dist/katex.min.css";
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
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossOrigin="anonymous" />
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmFGEkkP2" crossOrigin="anonymous"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" integrity="sha384-+VBxd3r6XgURycqtZ117nYw44SU3AYYGpArKGYrSqsTnJ5TTd3FSEE5ADZslDxXm" crossOrigin="anonymous"
          onLoad={
            // Using an IIFE to ensure this runs after the script loads
            // and to avoid polluting the global scope if not necessary.
            // Directly embedding function calls in onLoad can sometimes be tricky.
            "(() => { if (window.renderMathInElement) { document.body.querySelectorAll('.render-math').forEach(el => window.renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\\\[', right: '\\\\]', display: true}, {left: '\\\\(', right: '\\\\)', display: false} ]})); } })()"
          }
        ></script>
        <script src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>
      </head>
      <body className={`${inter.variable} ${firaCode.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <AuthProvider> {/* Re-enabled AuthProvider */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <Toaster /> {/* Re-enabled Toaster */}
          <FloatingChatbotButton />
        </AuthProvider>
        {/* <Analytics /> */} {/* Vercel Analytics currently commented out */}
      </body>
    </html>
  );
}
