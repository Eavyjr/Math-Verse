
'use client';

import Link from 'next/link';
import { MathLogoIcon } from '@/components/icons/math-logo';
import { Button } from '@/components/ui/button';
// import { User } from 'lucide-react'; // Placeholder for user avatar

export default function Header() {
  // const isAuthenticated = false; // TODO: Replace with actual auth state

  return (
    <header className="py-4 px-6 border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          <MathLogoIcon className="h-8 w-8" />
          <span>MathVerse</span>
        </Link>
        <nav>
          {/* TODO: Add user avatar and dropdown if authenticated */}
          <Button variant="outline" asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
