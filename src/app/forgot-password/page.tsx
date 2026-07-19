import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
