import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  referrer: 'no-referrer',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-[#e8edf2]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
