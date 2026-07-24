import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../features/auth/auth.hooks";
import { getApiErrorMessage } from "../lib/api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const errorMessage = loginMutation.isError
    ? getApiErrorMessage(loginMutation.error)
    : null;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate("/dashboard");
        },
      },
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/10 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <p className="text-sm font-semibold tracking-[0.2em] text-indigo-600 uppercase dark:text-indigo-400">
          Mailflow
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to manage your email campaigns and jobs.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
            />
          </label>

          {errorMessage && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
              {errorMessage}
            </p>
          )}

          <button
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loginMutation.isPending}
            type="submit"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
