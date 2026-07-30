import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../lib/api/client";
import { type EmailJobStatus } from "../features/dashboard/dashboard.api";
import { useDashboardOverview } from "../features/dashboard/dashboard.hooks";

const statusStyles: Record<EmailJobStatus, string> = {
  COMPLETED:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
  ACTIVE:
    "bg-sky-500/10 text-sky-700 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/20",
  WAITING:
    "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
  RETRYING:
    "bg-orange-500/10 text-orange-700 ring-orange-600/20 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/20",
  FAILED:
    "bg-rose-500/10 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20",
  CANCELED:
    "bg-slate-500/10 text-slate-700 ring-slate-600/20 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20",
};

function formatStatus(status: EmailJobStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function DashboardPage() {
  const { data, error, isLoading } = useDashboardOverview();

  const emailJobs = data?.emailJobs.byStatus;
  const waitingJobs = emailJobs?.WAITING ?? 0;
  const retryingJobs = emailJobs?.RETRYING ?? 0;
  const activeJobs = emailJobs?.ACTIVE ?? 0;
  const completedJobs = emailJobs?.COMPLETED ?? 0;
  const failedJobs = emailJobs?.FAILED ?? 0;

  const stats = [
    {
      label: "Queued jobs",
      value: waitingJobs + retryingJobs,
      detail: `${waitingJobs} waiting · ${retryingJobs} retrying`,
    },
    {
      label: "Processing",
      value: activeJobs,
      detail: "Currently claimed by workers",
    },
    {
      label: "Delivered",
      value: completedJobs,
      detail: "Completed email jobs",
    },
    {
      label: "Failed",
      value: failedJobs,
      detail: "Needs attention or recovery",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-col gap-6 border-b border-slate-200 pb-8 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-indigo-600 uppercase dark:text-indigo-400">
              Mailflow
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">
              Email queue dashboard
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Monitor your asynchronous email jobs.
            </p>
          </div>

          <Link
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950"
            to="/campaigns/new"
          >
            Create campaign
          </Link>
        </header>

        {error ? (
          <div className="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
            Could not load dashboard data: {getApiErrorMessage(error)}
          </div>
        ) : null}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {stat.label}
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                {isLoading ? "—" : stat.value}
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
                {stat.detail}
              </p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Recent jobs
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Auto-refreshes every five seconds.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1.5 text-sm font-medium text-sky-700 dark:text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              API polling
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs tracking-wider text-slate-500 uppercase dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Recipient</th>
                  <th className="px-6 py-4 font-medium">Campaign</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Attempts</th>
                  <th className="px-6 py-4 font-medium">Updated</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-slate-500 dark:text-slate-400"
                      colSpan={5}
                    >
                      Loading queue activity...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && data?.recentJobs.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-slate-500 dark:text-slate-400"
                      colSpan={5}
                    >
                      No email jobs yet. Create a campaign to start the queue.
                    </td>
                  </tr>
                ) : null}

                {data?.recentJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-950 dark:text-white">
                        {job.recipientEmail}
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {job.id}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {job.campaign.name}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[job.status]}`}
                      >
                        {formatStatus(job.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {job.attemptsMade} / {job.maxAttempts}
                    </td>

                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {formatDate(job.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
