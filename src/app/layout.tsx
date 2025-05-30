
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
// import { AuthProvider } from '@/context/auth-context'; // AuthProvider is currently commented out
import { Toaster } from '@/components/ui/toaster';
import FloatingChatbotButton from '@/components/chatbot/floating-chatbot-button';
import KatexLoader from '@/components/layout/katex-loader'; // Ensure KatexLoader is imported

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
        {/* Static KaTeX CSS can remain here */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossOrigin="anonymous" />
        
        {/* Desmos script can remain here as it doesn't use client-side event handlers directly in RootLayout */}
        <script src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>
      </head>
      <body className={`${inter.variable} ${firaCode.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        {/* <AuthProvider> */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <Toaster /> {/* Toaster should be inside AuthProvider if it uses auth context, but fine here if standalone */}
          <FloatingChatbotButton />
          <KatexLoader /> {/* KatexLoader handles KaTeX JS and auto-render script with its onLoad */}
        {/* </AuthProvider> */}
        {/* Vercel Analytics can be here if re-enabled */}
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
