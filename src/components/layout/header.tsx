
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Calculator as CalculatorIconLucide, UserCircle, LogOut, LayoutDashboard, User, BotMessageSquare, LayoutGrid, Sigma, Ratio, Grid3X3, Share2, FunctionSquare, BarChartHorizontalBig, Shapes, Move3d, Layers, TestTubeDiagonal } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '../ui/skeleton';
import PopupCalculator from '@/components/calculator/popup-calculator';

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

const workstationsHeaderLinks = [
  { title: "Algebra", href: "/operations/algebra", icon: <CalculatorIconLucide className="mr-2 h-4 w-4" /> },
  { title: "Integration", href: "/operations/integration", icon: <Sigma className="mr-2 h-4 w-4" /> },
  { title: "Differentiation & DEs", href: "/operations/differentiation", icon: <Ratio className="mr-2 h-4 w-4" /> },
  { title: "Matrix Operations", href: "/operations/matrix", icon: <Grid3X3 className="mr-2 h-4 w-4" /> },
  { title: "Linear Transformations", href: "/operations/linear-transformations", icon: <Shapes className="mr-2 h-4 w-4" /> },
  { title: "Graph Theory", href: "/operations/graph-theory", icon: <Share2 className="mr-2 h-4 w-4" /> },
  { title: "Statistics", href: "/operations/statistics", icon: <BarChartHorizontalBig className="mr-2 h-4 w-4" /> },
  { title: "Graphing Calculator", href: "/operations/graphing-calculator", icon: <FunctionSquare className="mr-2 h-4 w-4" /> },
  { title: "Vector Operations", href: "/operations/vector-operations", icon: <Move3d className="mr-2 h-4 w-4" /> },
  { title: "Model Generator", href: "/model-generator", icon: <Layers className="mr-2 h-4 w-4" /> },
  { title: "WolframAlpha", href: "/operations/wolframalpha-workspace", icon: <TestTubeDiagonal className="mr-2 h-4 w-4" /> },
];


export default function Header() {
  const { user, isLoading: authIsLoading, signOut } = useAuth();
  const [isCalculatorDialogOpen, setIsCalculatorDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  return (
    <header className="py-4 px-6 border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
           <BotMessageSquare className="h-8 w-8" />
          <span>MathVerse</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Dialog open={isCalculatorDialogOpen} onOpenChange={setIsCalculatorDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open Scientific Calculator">
                <CalculatorIconLucide className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs p-4 border shadow-2xl rounded-xl bg-popover">
              <DialogHeader>
                <DialogTitle>Scientific Calculator</DialogTitle>
              </DialogHeader>
              {isClient && isCalculatorDialogOpen && <PopupCalculator />}
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open Workstations Menu">
                <LayoutGrid className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Math Workstations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workstationsHeaderLinks.map((ws) => (
                <DropdownMenuItem key={ws.href} asChild>
                  <Link href={ws.href} className="flex items-center w-full">
                    {ws.icon}
                    {ws.title}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {authIsLoading ? (
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
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
