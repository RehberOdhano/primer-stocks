import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sign up</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Get $100,000 fake USD and Rs 5,000,000 fake PKR to practice with — no real money,
        ever.
      </p>
      <SignupForm />
    </main>
  );
}
