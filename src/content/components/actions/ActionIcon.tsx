import type { ActionIcon as ActionIconName } from '@/features/actions';

interface ActionIconProps {
  readonly icon: ActionIconName;
}

const ICON_LABELS: Readonly<Record<ActionIconName, string>> = {
  copy: 'C',
  external: 'O',
  folder: 'F',
  heart: 'H',
  menu: 'M',
  rename: 'R',
  select: 'S',
  sparkle: 'A',
  trash: 'D',
};

export function ActionIcon({ icon }: ActionIconProps) {
  return (
    <span
      aria-hidden="true"
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-500"
    >
      {ICON_LABELS[icon]}
    </span>
  );
}
