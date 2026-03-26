interface ModelBadgeProps {
  model: string;
}

export function ModelBadge({ model }: ModelBadgeProps) {
  return (
    <span className="px-2 py-1 rounded bg-accent-cyan/20 text-accent-cyan text-xs font-mono">
      {model}
    </span>
  );
}
