export function LoadingState({
  className = "p-8 text-center text-xs font-mono text-[var(--app-muted)]",
  text = "加载中...",
}) {
  return <div className={className}>{text}</div>;
}
export function EmptyState({
  className = "p-12 text-center",
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className={className}>
      <Icon className="mx-auto mb-3 h-12 w-12 text-[var(--app-border)]" />
      <p className="text-sm font-mono text-[var(--app-text)]">{title}</p>
      {description ? (
        <p className="mt-2 text-xs font-mono text-[var(--app-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
