
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, Settings, UserCircle } from 'lucide-react'; // Added icons
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height,100px)-var(--footer-height,80px))] flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    // This state should ideally not be reached due to the redirect,
    // but it's a fallback or for the brief moment before redirection.
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height,100px)-var(--footer-height,80px))] flex-col items-center justify-center">
        <p className="text-muted-foreground">Redirecting to sign-in...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Welcome to Your Dashboard!</h1>
          <p className="text-lg text-muted-foreground">
            Hello, <span className="font-semibold text-foreground">{user.displayName || user.email || 'User'}</span>!
          </p>
        </div>
        <Button onClick={signOut} variant="outline">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Dashboard Overview</CardTitle>
          <CardDescription>Here's a summary of your activity and quick links.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Workstations</CardTitle>
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Quickly access your favorite math tools.
              </p>
              <Button asChild variant="link" className="p-0 h-auto">
                <Link href="/">Go to Workstations</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Settings</CardTitle>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Manage your profile and preferences.
              </p>
              <Button variant="link" disabled className="p-0 h-auto text-muted-foreground">
                Manage Account (Coming Soon)
              </Button>
            </CardContent>
          </Card>
          
          {/* Add more summary cards here as features get built (e.g., saved graphs, history) */}
          <Card className="hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-5 w-5 text-muted-foreground"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Your recent calculations and interactions will appear here.
              </p>
              <p className="text-sm text-muted-foreground italic">Feature coming soon.</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
            This is your personal MathVerse dashboard. More features coming soon!
        </p>
    </div>
  );
}
