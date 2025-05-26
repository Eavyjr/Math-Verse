
import type { Metadata } from 'next';
// import { Inter, Fira_Code } from 'next/font/google'; // Temporarily commented out
import './globals.css';
import Header from '@/components/layout/header';
// import Footer from '@/components/layout/footer'; // Temporarily commented out
// import { AuthProvider } from '@/context/auth-context'; // AuthProvider commented out
// import { Toaster } from '@/components/ui/toaster'; // Toaster commented out
// import { Analytics } from "@vercel/analytics/next"; // Vercel Analytics commented out
import "katex/dist/katex.min.css"; // Import KaTeX CSS globally

/* // Temporarily commented out
const inter = Inter({
  variable: '--font-geist-sans', 
  subsets: ['latin'],
});

const firaCode = Fira_Code({
  variable: '--font-geist-mono', 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});
*/

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
        {/* KaTeX CSS is imported above now */}
        {/* Desmos API Script - Using provided API key, removed async */}
        <script src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>
      </head>
      {/* <body className={`${inter.variable} ${firaCode.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}> */}
      <body className={`antialiased flex flex-col min-h-screen bg-background text-foreground`}> {/* Temporarily removed font variables */}
        {/* <AuthProvider> */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          {/* <Footer /> */} {/* Temporarily commented out */}
          {/* <Toaster /> */} {/* Temporarily commented out */}
        {/* </AuthProvider> */}
        {/* <Analytics /> */} {/* Temporarily commented out */}
      </body>
    </html>
  );
}
