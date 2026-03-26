interface EmptyStateProps {
  message: string;
  icon?: string;
}

export function EmptyState({ message, icon = '📭' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-text-muted">{message}</p>
    </div>
  );
}
