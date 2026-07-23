type JobStatus = "completed" | "active" | "waiting" | "failed";

type Job = {
  id: string;
  recipient: string;
  campaign: string;
  status: JobStatus;
  attempts: string;
  createdAt: string;
};

const stats = [
  { label: "Queued jobs", value: "24", change: "+12% today" },
  { label: "Processing", value: "3", change: "2 workers online" },
  { label: "Delivered", value: "1,284", change: "98.6% success rate" },
  { label: "Failed", value: "7", change: "Needs attention" },
];

const jobs: Job[] = [
  {
    id: "job_01J8KX",
    recipient: "ana@example.com",
    campaign: "Welcome sequence",
    status: "completed",
    attempts: "1 / 3",
    createdAt: "Just now",
  },
  {
    id: "job_01J8KW",
    recipient: "maria@example.com",
    campaign: "July product update",
    status: "active",
    attempts: "1 / 3",
    createdAt: "1 minute ago",
  },
  {
    id: "job_01J8KV",
    recipient: "john@example.com",
    campaign: "Welcome sequence",
    status: "waiting",
    attempts: "0 / 3",
    createdAt: "2 minutes ago",
  },
  {
    id: "job_01J8KU",
    recipient: "lucas@example.com",
    campaign: "July product update",
    status: "failed",
    attempts: "3 / 3",
    createdAt: "4 minutes ago",
  },
];

const statusStyles: Record<JobStatus, string> = {
  completed: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
  active: "bg-sky-500/15 text-sky-300 ring-sky-400/20",
  waiting: "bg-amber-500/15 text-amber-300 ring-amber-400/20",
  failed: "bg-rose-500/15 text-rose-300 ring-rose-400/20",
};

function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-col gap-6 border-b border-slate-800 pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-indigo-400 uppercase">
              Mailflow
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Email queue dashboard
            </h1>
            <p className="mt-2 text-slate-400">
              Monitor asynchronous email jobs in real time.
            </p>
          </div>

          <button className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950">
            Create campaign
          </button>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-slate-500">{stat.change}</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent jobs</h2>
              <p className="mt-1 text-sm text-slate-400">
                Jobs added to the email delivery queue.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live updates
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-900 text-xs tracking-wider text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Recipient</th>
                  <th className="px-6 py-4 font-medium">Campaign</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Attempts</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {jobs.map((job) => (
                  <tr key={job.id} className="transition hover:bg-slate-800/60">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{job.recipient}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {job.id}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{job.campaign}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          statusStyles[job.status]
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{job.attempts}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {job.createdAt}
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
