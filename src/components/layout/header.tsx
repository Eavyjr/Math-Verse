
import Link from 'next/link';
import { MathLogoIcon } from '@/components/icons/math-logo';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react'; // Example, replace with actual auth state

export default function Header() {
  const isAuthenticated = false; // TODO: Replace with actual auth state from Firebase/context

  return (
    <header className="py-4 px-6 border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          <MathLogoIcon className="h-8 w-8" />
          <span>MathVerse</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard"> {/* Or profile page */}
                <User className="h-6 w-6" />
                <span className="sr-only">User Profile</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
