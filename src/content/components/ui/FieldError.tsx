interface FieldErrorProps {
  readonly children: string | null;
}

export function FieldError({ children }: FieldErrorProps) {
  if (children === null) {
    return null;
  }

  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
      {children}
    </p>
  );
}
