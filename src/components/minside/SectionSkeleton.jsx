export default function SectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 bg-muted rounded animate-pulse" />
      <div className="bg-card rounded-lg border border-border p-6 space-y-3">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-44 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}