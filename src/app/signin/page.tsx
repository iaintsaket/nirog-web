import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInPage } from "@/features/auth/SignInPage";

export const metadata: Metadata = { title: "Sign in" };

export default function SignIn() {
  return (
    <Suspense>
      <SignInPage />
    </Suspense>
  );
}
