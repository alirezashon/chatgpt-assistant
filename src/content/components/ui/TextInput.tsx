import type { InputHTMLAttributes } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
}

export function TextInput({ className = '', id, label, ...props }: TextInputProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-slate-800">{label}</span>
      <input
        className={[
          'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200',
          className,
        ].join(' ')}
        id={id}
        {...props}
      />
    </label>
  );
}
