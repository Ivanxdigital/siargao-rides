"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailPage() {
  return (
    <div className="pt-24">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card shadow-md rounded-lg p-8 border border-border text-center">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
          
          <p className="text-muted-foreground mb-6">
            We've sent a verification link to your email address.
            Please check your inbox and click the link to verify your account.
          </p>
          
          <div className="bg-muted/30 rounded-md p-4 mb-6">
            <p className="text-sm">
              If you don't see the email in your inbox, please check your spam folder.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <Button asChild>
              <Link href="/sign-in">
                Return to Sign In
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 