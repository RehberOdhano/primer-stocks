import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <ResetPasswordForm />
    </main>
  );
}
