export function FolderSkeletonList() {
  return (
    <div className="space-y-2 px-4 py-4" aria-label="Loading folders">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-11 animate-pulse rounded-lg bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
        />
      ))}
    </div>
  );
}
