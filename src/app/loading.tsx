export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/5] rounded-2xl bg-line/50 dark:bg-line-dark/50" />
            <div className="mt-3 h-3 w-2/3 rounded bg-line/50 dark:bg-line-dark/50" />
            <div className="mt-2 h-3 w-1/3 rounded bg-line/50 dark:bg-line-dark/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
