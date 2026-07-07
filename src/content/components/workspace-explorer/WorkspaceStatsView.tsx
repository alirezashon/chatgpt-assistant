import type { WorkspaceExplorerStats } from '@/content/components/workspace-explorer/workspace-explorer-types';

interface WorkspaceStatsViewProps {
  readonly stats: WorkspaceExplorerStats;
}

export function WorkspaceStatsView({ stats }: WorkspaceStatsViewProps) {
  return (
    <section className="border-t border-slate-200 px-4 py-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        Workspace Statistics
      </h3>
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
