import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence?: number;
  showLabel?: boolean;
}

export function ConfidenceBadge({ confidence, showLabel = false }: ConfidenceBadgeProps) {
  if (confidence === undefined || confidence === null) {
    return null;
  }

  // Convert to percentage if needed (confidence might be 0-1 or 0-100)
  const confidencePercent = confidence <= 1 ? confidence * 100 : confidence;
  const displayValue = Math.round(confidencePercent);

  // Determine color and icon based on confidence level
  const getConfidenceStyle = () => {
    if (confidencePercent >= 90) {
      return {
        variant: 'default' as const,
        className: 'bg-success/15 text-success border-success/30 hover:bg-success/20',
        icon: ShieldCheck,
        label: 'High Confidence'
      };
    } else if (confidencePercent >= 75) {
      return {
        variant: 'default' as const,
        className: 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/20',
        icon: Shield,
        label: 'Good Confidence'
      };
    } else if (confidencePercent >= 60) {
      return {
        variant: 'default' as const,
        className: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/20',
        icon: Shield,
        label: 'Moderate Confidence'
      };
    } else {
      return {
        variant: 'default' as const,
        className: 'bg-muted/50 text-muted-foreground border-border hover:bg-muted/70',
        icon: ShieldAlert,
        label: 'Lower Confidence'
      };
    }
  };

  const style = getConfidenceStyle();
  const Icon = style.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={style.variant} 
            className={`${style.className} font-medium text-xs cursor-help`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {displayValue}%
            {showLabel && <span className="ml-1 hidden sm:inline">{style.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold">{style.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            AI confidence score: {displayValue}% based on data extraction quality and source reliability.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
