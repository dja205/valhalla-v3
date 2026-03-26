import { shortenModel, getModelTier } from '@/lib/utils';

interface ModelBadgeProps {
  model: string;
}

const tierStyles = {
  premium: 'bg-purple-500/20 text-purple-400',
  standard: 'bg-accent-cyan/20 text-accent-cyan',
  fast: 'bg-success/20 text-success',
};

export function ModelBadge({ model }: ModelBadgeProps) {
  const shortName = shortenModel(model);
  const tier = getModelTier(model);
  const style = tierStyles[tier];
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono ${style}`}>
      {shortName}
    </span>
  );
}
