
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calculator, X, UserCircle, LogOut, LayoutDashboard, User } from 'lucide-react'; // Added User icon
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context'; // Ensure this is uncommented
import { Skeleton } from '../ui/skeleton'; // For loading state

// import { MathLogoIcon } from '@/components/icons/math-logo'; // Assuming this will be restored

declare global {
  interface Window {
    Desmos?: any;
  }
}

type DesmosInitStatus = 'idle' | 'loading_api' | 'preparing' | 'success' | 'error';

// Helper function to get initials
const getInitials = (name?: string | null, email?: string | null): string => {
  if (name) {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U'; // Default User
};


export default function Header() {
  const { user, isLoading: authIsLoading, signOut } = useAuth(); // Use auth context
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

    if (isClient && isScientificCalculatorOpen && scientificCalculatorRef.current) {
      if (window.Desmos) {
        if (!desmosSciInstanceRef.current) {
          setDesmosSciInitStatus('preparing');
          try {
            scientificCalculatorRef.current.innerHTML = ''; // Clear container before init
            calculator = window.Desmos.ScientificCalculator(scientificCalculatorRef.current, {});
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
          setDesmosSciInitStatus('success');
        }
      } else {
        setDesmosSciInitStatus('loading_api');
      }
    } else if (!isScientificCalculatorOpen) {
      if (desmosSciInstanceRef.current && typeof desmosSciInstanceRef.current.destroy === 'function') {
        try {
          if(desmosSciInstanceRef.current.getState || desmosSciInstanceRef.current.HelperExpression) { // Check if it's a valid Desmos instance
             desmosSciInstanceRef.current.destroy();
          }
        } catch (e) {
          // console.error("Error destroying Desmos instance:", e);
        }
        desmosSciInstanceRef.current = null;
      }
      setDesmosSciInitStatus('idle');
    }

    return () => {
      if (desmosSciInstanceRef.current && typeof desmosSciInstanceRef.current.destroy === 'function') {
         try {
           if(desmosSciInstanceRef.current.getState || desmosSciInstanceRef.current.HelperExpression) {
             desmosSciInstanceRef.current.destroy();
           }
        } catch (e) {
          // console.error("Error destroying Desmos instance on unmount:", e);
        }
        desmosSciInstanceRef.current = null;
      }
    };
  }, [isScientificCalculatorOpen, isClient]);


  return (
    <header className="py-4 px-6 border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          {/* <MathLogoIcon className="h-8 w-8" /> */} {/* Assuming MathLogoIcon will be restored */}
          MathVerse
        </Link>
        <nav className="flex items-center gap-3">
          <Dialog open={isScientificCalculatorOpen} onOpenChange={setIsScientificCalculatorOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open Scientific Calculator">
                <Calculator className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0">
              <DialogHeader className="p-4 pb-0 flex flex-row justify-between items-center">
                <DialogTitle>Scientific Calculator</DialogTitle>
                 <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
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
                        <p className="text-destructive text-center p-4">Failed to load calculator. Please try again.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {authIsLoading ? (
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-20" />
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-auto">
                  <Avatar className="h-8 w-8">
                    {user.photoURL ? (
                      <AvatarImage src={user.photoURL} alt={user.displayName || user.email || 'User Avatar'} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.displayName, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-foreground">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  Profile (Soon)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
