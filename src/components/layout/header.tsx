
'use client';

import Link from 'next/link';
// import { MathLogoIcon } from '@/components/icons/math-logo'; // Temporarily commented out
import { Button } from '@/components/ui/button';
// import { User } from 'lucide-react'; // Temporarily commented out

export default function Header() {
  // const isAuthenticated = false; // TODO: Replace with actual auth state

  return (
    <header className="py-4 px-6 border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          MathVerse (Simplified)
        </Link>
        <nav>
          <Button variant="outline" asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Link>
        </nav>
      </div>
    </header>
  );
}
