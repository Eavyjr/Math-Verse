
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { useAuth } from '@/context/auth-context';
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/schemas';
import { handleUpdateProfileAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, UserCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: '',
    },
  });

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/auth/signin');
    }
    if (user) {
      form.reset({ fullName: user.displayName || '' });
    }
  }, [user, isAuthLoading, router, form]);

  const onSubmit: SubmitHandler<UpdateProfileFormData> = async (data) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You are not signed in.",
      });
      return;
    }
    setIsUpdating(true);
    const result = await handleUpdateProfileAction(user, data);
    setIsUpdating(false);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.error,
      });
    } else {
      toast({
        title: "Success!",
        description: "Your profile has been updated.",
      });
      // The user object in the auth context will update on the next page refresh/hard nav
    }
  };
  
  if (isAuthLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height,100px)-var(--footer-height,80px))] flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>
       <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" />
            Manage Your Profile
          </CardTitle>
          <CardDescription>View and update your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input value={user.email || 'No email provided'} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name / Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </form>
          </Form>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-xl font-semibold text-destructive">Danger Zone</h3>
            <Card className="border-destructive bg-destructive/10">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-destructive">Update Password</h4>
                        <p className="text-sm text-destructive/80">Change your password. This action may require a recent login.</p>
                    </div>
                    <Button variant="outline" disabled>Change Password (Soon)</Button>
                </CardContent>
            </Card>
            <Card className="border-destructive bg-destructive/10">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-destructive">Delete Account</h4>
                        <p className="text-sm text-destructive/80">Permanently delete your account and all associated data. This action is irreversible.</p>
                    </div>
                    <Button variant="destructive" disabled>Delete Account (Soon)</Button>
                </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
