
'use client';

import SignUpForm from '@/components/auth/signup-form';

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height,100px)-var(--footer-height,80px))] flex-col items-center justify-center p-4 bg-background">
      {/* Adjust min-h based on actual header/footer heights or use flex-grow in layout */}
      <SignUpForm />
    </div>
  );
}
