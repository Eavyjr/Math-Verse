
'use client';

import Link from 'next/link';
import { MathLogoIcon } from '@/components/icons/math-logo';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calculator, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

// AuthProvider and related imports are currently commented out
// import { useAuth } from '@/context/auth-context';
// import { Skeleton } from '@/components/ui/skeleton';
// import { LogOut, UserCircle } from 'lucide-react';

declare global {
  interface Window {
    Desmos?: any;
  }
}

type DesmosInitStatus = 'idle' | 'loading_api' | 'preparing' | 'success' | 'error';

export default function Header() {
  // const { user, isLoading: authIsLoading, signOut } = useAuth(); // Auth logic commented out
  const [isScientificCalculatorOpen, setIsScientificCalculatorOpen] = useState(false);
  const scientificCalculatorRef = useRef<HTMLDivElement>(null);
  const desmosSciInstanceRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [desmosSciInitStatus, setDesmosSciInitStatus] = useState<DesmosInitStatus>('idle');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let calculator: any = null;

    if (isClient && isScientificCalculatorOpen) {
      if (scientificCalculatorRef.current) {
        if (window.Desmos) {
          if (!desmosSciInstanceRef.current) { // Only init if no instance exists
            setDesmosSciInitStatus('preparing');
            try {
              // Ensure the container is clean before Desmos tries to initialize
              // This helps if the dialog was opened, closed, and reopened quickly.
              while (scientificCalculatorRef.current.firstChild) {
                scientificCalculatorRef.current.removeChild(scientificCalculatorRef.current.firstChild);
              }
              calculator = window.Desmos.ScientificCalculator(scientificCalculatorRef.current, {
                // Optionally, set some Desmos options here if needed
                // e.g., settingsMenu: false, zoomButtons: false,
              });
              if (calculator) {
                desmosSciInstanceRef.current = calculator;
                setDesmosSciInitStatus('success');
              } else {
                console.error("Desmos.ScientificCalculator returned a falsy value.");
                setDesmosSciInitStatus('error');
              }
            } catch (e) {
              console.error("Error initializing Desmos Scientific Calculator in header:", e);
              setDesmosSciInitStatus('error');
            }
          } else {
             // Instance already exists, assume it's fine.
            setDesmosSciInitStatus('success');
          }
        } else {
          setDesmosSciInitStatus('loading_api');
        }
      } else {
        // Ref not available yet, should be rare if dialog content is mounted
        // Set to idle or a specific 'ref_not_ready' state if needed for debugging
        setDesmosSciInitStatus('idle');
      }
    } else if (!isScientificCalculatorOpen) {
      // Dialog is closed or component is not client-side ready
      if (desmosSciInstanceRef.current && typeof desmosSciInstanceRef.current.destroy === 'function') {
        desmosSciInstanceRef.current.destroy();
        desmosSciInstanceRef.current = null;
      }
      setDesmosSciInitStatus('idle'); // Reset status when dialog is closed
    }

    // Cleanup function for when the component unmounts OR dependencies change causing re-run before dialog close
    return () => {
      if (desmosSciInstanceRef.current && typeof desmosSciInstanceRef.current.destroy === 'function') {
        // Check if it's a valid instance before destroying
        if(desmosSciInstanceRef.current.HelperExpression !== undefined || desmosSciInstanceRef.current.getState !== undefined) {
            desmosSciInstanceRef.current.destroy();
        }
        desmosSciInstanceRef.current = null;
      }
    };
  }, [isScientificCalculatorOpen, isClient]);

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
                  {isScientificCalculatorOpen && (
                    <>
                      {!isClient && <p className="text-muted-foreground text-center p-4">Initializing...</p>}
                      {isClient && desmosSciInitStatus === 'loading_api' && (
                        <p className="text-muted-foreground text-center p-4">Loading Desmos API...</p>
                      )}
                      {isClient && (desmosSciInitStatus === 'idle' || desmosSciInitStatus === 'preparing') && window.Desmos && (
                         <p className="text-muted-foreground text-center p-4">Preparing calculator...</p>
                      )}
                      {desmosSciInitStatus === 'error' && (
                        <p className="text-destructive text-center p-4">Failed to load calculator. Please ensure you are online or try again.</p>
                      )}
                      {/* If status is 'success', Desmos should have taken over this div. No explicit message here. */}
                    </>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* AuthProvider related UI is currently commented out */}
          {/* {authIsLoading ? (
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
          ) : ( */}
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          {/* )} */}
        </nav>
      </div>
    </header>
  );
}
