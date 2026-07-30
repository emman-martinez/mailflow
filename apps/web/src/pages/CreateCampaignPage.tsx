import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateCampaign } from "../features/campaigns/campaigns.hooks";
import { getApiErrorMessage } from "../lib/api/client";

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const createCampaignMutation = useCreateCampaign();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [formError, setFormError] = useState("");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const errorMessage =
    formError ||
    (createCampaignMutation.isError
      ? getApiErrorMessage(createCampaignMutation.error)
      : "");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const recipients = recipientsText
      .split(/[\n,]+/)
      .map((recipient) => recipient.trim().toLowerCase())
      .filter(Boolean);

    if (recipients.length === 0) {
      setFormError("Add at least one recipient email address.");
      return;
    }

    createCampaignMutation.mutate(
      {
        name,
        subject,
        body,
        recipients,
        scheduledAt: scheduledAt
          ? new Date(scheduledAt).toISOString()
          : undefined,
        timezone,
      },
      {
        onSuccess: () => {
          navigate("/dashboard");
        },
      },
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto max-w-3xl">
        <Link
          className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
          to="/dashboard"
        >
          ← Back to dashboard
        </Link>

        <header className="mt-6 border-b border-slate-200 pb-8 dark:border-slate-800">
          <p className="text-sm font-semibold tracking-[0.2em] text-indigo-600 uppercase dark:text-indigo-400">
            Mailflow
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Create campaign
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Each recipient becomes an independent, trackable email job.
          </p>
        </header>

        <form
          className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          onSubmit={handleSubmit}
        >
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Campaign name
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              maxLength={120}
              minLength={3}
              onChange={(event) => setName(event.target.value)}
              placeholder="July product update"
              required
              value={name}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email subject
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              maxLength={200}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="New features in Mailflow"
              required
              value={subject}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Message
            <textarea
              className="mt-2 min-h-40 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              maxLength={10_000}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the email content..."
              required
              value={body}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Recipients
            <textarea
              className="mt-2 min-h-32 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              onChange={(event) => setRecipientsText(event.target.value)}
              placeholder={"first@example.com\nsecond@example.com"}
              required
              value={recipientsText}
            />
            <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
              Add one email per line or separate addresses with commas.
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Schedule for later{" "}
            <span className="text-slate-400">(optional)</span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              onChange={(event) => setScheduledAt(event.target.value)}
              type="datetime-local"
              value={scheduledAt}
            />
            <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
              Time zone: {timezone}
            </span>
          </label>

          {errorMessage ? (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              to="/dashboard"
            >
              Cancel
            </Link>

            <button
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={createCampaignMutation.isPending}
              type="submit"
            >
              {createCampaignMutation.isPending
                ? "Queueing campaign..."
                : "Create campaign"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
