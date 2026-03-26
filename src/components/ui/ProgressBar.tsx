interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  burnRate?: string;
}

export function ProgressBar({ value, max, label, burnRate }: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const colorClass = percentage > 90 ? 'bg-danger' : percentage > 70 ? 'bg-accent-amber' : 'bg-success';

  return (
    <div>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-muted">{label}</span>
          <span className="text-text-primary font-medium">
            {value.toFixed(0)} / {max.toFixed(0)}
          </span>
        </div>
      )}
      
      <div className="w-full bg-bg-base rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {burnRate && (
        <div className="text-xs text-text-muted mt-1 text-right">
          {burnRate}
        </div>
      )}
    </div>
  );
}
