
'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold text-primary mb-6">
          MathVerse - Simplified Test Page
        </h1>
        <p className="text-lg text-foreground/80 mb-8">
          If you see this, the basic page rendering is working. The Internal Server Error might be related to the original complex content of this page or a global issue.
        </p>
        <div className="flex space-x-4">
          <Button asChild>
            <Link href="/operations/algebra">Go to Algebra</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signin">Go to Sign In</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
