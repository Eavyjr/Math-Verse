
'use client';

import SignInForm from '@/components/auth/signin-form';

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height,100px)-var(--footer-height,80px))] flex-col items-center justify-center p-4 bg-background">
       {/* Adjust min-h based on actual header/footer heights or use flex-grow in layout */}
      <SignInForm />
    </div>
  );
}
