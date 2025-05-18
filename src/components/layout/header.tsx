import Link from 'next/link';
import { MathLogoIcon } from '@/components/icons/math-logo';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="py-4 px-6 border-b bg-card shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          <MathLogoIcon className="h-8 w-8" />
          <span>MathGenius</span>
        </Link>
        {/* Placeholder for future navigation or user avatar */}
        {/* <nav className="flex items-center gap-4">
          <Button variant="ghost">Sign In</Button>
        </nav> */}
      </div>
    </header>
  );
}
