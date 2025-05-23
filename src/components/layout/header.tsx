
'use client';

import Link from 'next/link';
import { MathLogoIcon } from '@/components/icons/math-logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, UserCircle } from 'lucide-react'; // Icons for user state

export default function Header() {
  const { user, isLoading, signOut } = useAuth();

  return (
    <header className="py-4 px-6 border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          <MathLogoIcon className="h-8 w-8" />
          <span>MathVerse</span>
        </Link>
        <nav>
          {isLoading ? (
            <Skeleton className="h-10 w-24" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <span className="hidden sm:inline">{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
