import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <LoginForm />
    </main>
  );
}
