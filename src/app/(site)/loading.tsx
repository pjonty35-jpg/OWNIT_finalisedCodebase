/** Route-level skeleton: shows instantly while the server renders the next page. */
export default function Loading() {
  return (
    <div className="wrap pt-32 pb-24" aria-busy="true" aria-live="polite">
      <div className="animate-pulse space-y-8">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-line" />
          <div className="h-10 w-2/3 max-w-md rounded-lg bg-line" />
          <div className="h-3 w-56 rounded bg-line/70" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-line">
              <div className="aspect-square bg-line/60" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-3/4 rounded bg-line" />
                <div className="h-3 w-1/3 rounded bg-line/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
