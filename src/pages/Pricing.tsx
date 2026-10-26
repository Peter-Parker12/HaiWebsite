const STREAMS: [string, string][] = [
  ['Premium collaboration tools', 'Project teams, professional artists'],
  ['Premium resource matching', 'Projects or organizations seeking partners'],
  ['Fundraising & partnership support', 'Projects with a budget, cultural institutions'],
  ['Featured projects / promoted posts', 'Project teams looking to increase accessibility'],
  ['Crowdfunding commission', 'Projects receiving financial contributions'],
  ['Idea licensing / marketplace', 'Individuals looking to develop an existing concept'],
  ['Institutional subscription', 'Galleries, festivals, museums, cultural foundations'],
]

export default function Pricing() {
  return (
    <div>
      <main className="mx-auto max-w-4xl px-5 py-14">
        <div className="text-sm font-bold uppercase tracking-widest text-terra-500">Business model</div>
        <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">How the platform earns</h1>
        <p className="mt-4 text-lg text-ink/70">
          The model combines premium collaboration and resource-matching services, institutional subscriptions,
          project-development support and, at a later stage, commissions from licensed concepts and successful fundraising.
        </p>

        <div className="mt-8 overflow-hidden rounded-lg border border-cloth-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cloth-100 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-5 py-3">Revenue stream</th>
                <th className="px-5 py-3">Who pays</th>
              </tr>
            </thead>
            <tbody>
              {STREAMS.map(([s, p]) => (
                <tr key={s} className="border-t border-cloth-200">
                  <td className="px-5 py-4 font-semibold">{s}</td>
                  <td className="px-5 py-4 text-ink/70">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-ink/50">
          Demo only: crowdfunding and licensing flows are simulated with a 5% and 10% commission shown for illustration. No
          payments are processed.
        </p>
      </main>
    </div>
  )
}
