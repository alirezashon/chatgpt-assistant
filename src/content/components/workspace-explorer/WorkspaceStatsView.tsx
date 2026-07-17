import type { WorkspaceExplorerStats } from '@/content/components/workspace-explorer/workspace-explorer-types';

interface WorkspaceStatsViewProps {
  readonly stats: WorkspaceExplorerStats;
}

export function WorkspaceStatsView({ stats }: WorkspaceStatsViewProps) {
  const organizedPercent =
    stats.totalConversations === 0
      ? 0
      : Math.round((stats.assignedConversations / stats.totalConversations) * 100);

  return (
    <section className="border-t border-slate-200 bg-white px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Workspace health
        </h3>
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
          {organizedPercent.toString()}% organized
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        <StatItem label="Total" value={stats.totalConversations} />
        <StatItem label="Assigned" value={stats.assignedConversations} />
        <StatItem label="Unassigned" value={stats.unassignedConversations} />
        <StatItem label="Folders" value={stats.folderCount} />
      </dl>
    </section>
  );
}

interface StatItemProps {
  readonly label: string;
  readonly value: number;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
