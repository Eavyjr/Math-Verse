
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { AuthProvider } from '@/context/auth-context'; // Ensure this is uncommented
import { Toaster } from '@/components/ui/toaster'; // Ensure this is uncommented
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

// Function to handle KaTeX auto-render script load
// This function is defined globally or passed appropriately if KatexLoader needs it.
// For this setup, KatexLoader handles its own script loading.
// const handleKatexAutoRenderLoad = () => {
//   if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
//     document.body.querySelectorAll('.render-math').forEach(el => {
//       (window as any).renderMathInElement(el, {
//         delimiters: [
//           {left: '$$', right: '$$', display: true},
//           {left: '$', right: '$', display: false},
//           {left: '\\\[', right: '\\\]', display: true},
//           {left: '\\\(', right: '\\\)', display: false}
//         ]
//       });
//     });
//   }
// };


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
        
        {/* Desmos API script */}
        <script src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>
      </head>
      <body className={`${inter.variable} ${firaCode.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <AuthProvider> {/* Ensure AuthProvider wraps components that need auth context */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <Toaster /> {/* Re-enabled for auth notifications */}
          <FloatingChatbotButton />
          <KatexLoader /> 
        </AuthProvider>
        {/* Vercel Analytics can be here if re-enabled */}
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
