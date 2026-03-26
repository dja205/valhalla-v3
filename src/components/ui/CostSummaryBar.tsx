import { useStore } from '@/stores';
import { formatCost } from '@/lib/utils';

export function CostSummaryBar() {
  const { limits } = useStore();

  if (!limits) return null;

  const costPercentage = (limits.currentSpend / limits.maxCostPerRun) * 100;

  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-text-muted">Current Spend</span>
        <span className="text-lg font-semibold text-text-primary">
          {formatCost(limits.currentSpend)}
        </span>
      </div>
      
      <div className="w-full bg-bg-base rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-accent-amber transition-all duration-300"
          style={{ width: `${Math.min(costPercentage, 100)}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-text-muted">
        <span>Budget: {formatCost(limits.maxCostPerRun)}</span>
        <span>Projected: {formatCost(limits.projectedSpend)}</span>
      </div>
    </div>
  );
}
