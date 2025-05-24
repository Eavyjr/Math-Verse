
'use client';

import Link from 'next/link';
import { MathLogoIcon } from '@/components/icons/math-logo';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Calculator, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

// auth-context and related imports are commented out as per previous instructions
// import { useAuth } from '@/context/auth-context';
// import { Skeleton } from '@/components/ui/skeleton';
// import { LogOut, UserCircle } from 'lucide-react';

declare global {
  interface Window {
    Desmos?: any;
  }
}

export default function Header() {
  // const { user, isLoading, signOut } = useAuth(); // Auth logic commented out
  const [isScientificCalculatorOpen, setIsScientificCalculatorOpen] = useState(false);
  const scientificCalculatorRef = useRef<HTMLDivElement>(null);
  const desmosSciInstanceRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client after the component mounts
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Guard against running this effect on the server or before client mount
    if (!isClient || !isScientificCalculatorOpen || !scientificCalculatorRef.current) {
      // If the dialog is closed, ensure the instance is destroyed
      if (!isScientificCalculatorOpen && desmosSciInstanceRef.current && typeof desmosSciInstanceRef.current.destroy === 'function') {
        desmosSciInstanceRef.current.destroy();
        desmosSciInstanceRef.current = null;
      }
      return;
    }

    let calculator: any = null;
    if (window.Desmos) { // window should be defined here because isClient is true
      if (!desmosSciInstanceRef.current) {
        try {
          calculator = window.Desmos.ScientificCalculator(scientificCalculatorRef.current, {
            // Scientific calculator specific options can go here if needed
          });
          desmosSciInstanceRef.current = calculator;
        } catch (e) {
          console.error("Error initializing Desmos Scientific Calculator:", e);
        }
      }
    } else {
      console.warn("Desmos API not loaded yet for scientific calculator popup.");
    }

    // Cleanup function for when the dialog closes or component unmounts
    return () => {
      if (desmosSciInstanceRef.current && typeof desmosSciInstanceRef.current.destroy === 'function') {
        desmosSciInstanceRef.current.destroy();
        desmosSciInstanceRef.current = null;
      }
    };
  }, [isScientificCalculatorOpen, isClient]); // Re-run if dialog visibility or isClient changes

  return (
    <header className="py-4 px-6 border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          <MathLogoIcon className="h-8 w-8" />
          <span>MathVerse</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Dialog open={isScientificCalculatorOpen} onOpenChange={setIsScientificCalculatorOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open Scientific Calculator">
                <Calculator className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0">
              <DialogHeader className="p-4 pb-0">
                <DialogTitle>Scientific Calculator</DialogTitle>
                 <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
              </DialogHeader>
              <div className="p-4 min-h-[300px] md:min-h-[400px]">
                <div ref={scientificCalculatorRef} className="w-full h-full min-h-[300px] md:min-h-[400px]">
                  {isClient && !window.Desmos && <p className="text-muted-foreground text-center">Loading calculator...</p>}
                  {!isClient && <p className="text-muted-foreground text-center">Initializing calculator...</p>}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Simplified header: Always show Sign In button for now */}
          <Button variant="outline" asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
          {/* 
          // Previous auth-dependent logic:
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
          */}
        </nav>
      </div>
    </header>
  );
}
