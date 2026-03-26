interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  burnRate?: number;
}

export function ProgressBar({ value, max, label, burnRate }: ProgressBarProps) {
  const percentage = (value / max) * 100;
  const isWarning = percentage > 80;
  const isDanger = percentage > 95;

  return (
    <div>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-muted">{label}</span>
          <span className="text-text-primary font-medium">
            {value.toFixed(0)} / {max.toFixed(0)}
            {burnRate && <span className="text-text-muted ml-2">({burnRate.toFixed(2)}/min)</span>}
          </span>
        </div>
      )}
      
      <div className="w-full bg-bg-base rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isDanger ? 'bg-danger' : isWarning ? 'bg-accent-amber' : 'bg-success'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
