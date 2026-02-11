import { ArrowUp, ArrowDown, CheckCircle2, AlertTriangle, XCircle, ExternalLink, Wifi, Info } from 'lucide-react';
import { BankMetric } from '@/data/dataSources';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Metric educational reference data
const metricReference: Record<string, { definition: string; industryStandard: string; regulatoryBenchmark: string }> = {
  'Net Interest Margin': {
    definition: 'The difference between interest income earned and interest paid out, expressed as a percentage of average earning assets.',
    industryStandard: 'U.S. bank median: 2.5%–3.5%. G-SIB peers typically range 2.0%–3.0%.',
    regulatoryBenchmark: 'No hard regulatory minimum. Monitored by OCC/FDIC as a key profitability indicator.',
  },
  'Return on Assets (ROA)': {
    definition: 'Net income divided by average total assets. Measures how efficiently a bank uses its assets to generate profit.',
    industryStandard: 'Strong: ≥1.0%. Adequate: 0.5%–1.0%. Weak: <0.5%.',
    regulatoryBenchmark: 'FDIC uses ROA in CAMELS rating under Earnings (E) component.',
  },
  'Return on Equity (ROE)': {
    definition: 'Net income divided by average shareholders\' equity. Indicates the return generated on shareholder investment.',
    industryStandard: 'Strong: ≥10%. Peer median: 10%–15%. Below 8% may signal underperformance.',
    regulatoryBenchmark: 'No regulatory minimum, but factored into supervisory assessments of earnings quality.',
  },
  'Tier 1 Capital Ratio': {
    definition: 'Core equity capital (CET1 + Additional Tier 1) as a percentage of risk-weighted assets. Primary measure of financial strength.',
    industryStandard: 'G-SIBs typically maintain 12%–16%. Community banks: 10%–14%.',
    regulatoryBenchmark: 'Well-capitalized: ≥8%. Adequately capitalized: ≥6%. Basel III minimum: 6%.',
  },
  'CET1 Ratio': {
    definition: 'Common Equity Tier 1 capital (common stock + retained earnings) divided by risk-weighted assets. The highest quality capital measure.',
    industryStandard: 'G-SIBs typically hold 12%–15%. U.S. median: ~10%–13%.',
    regulatoryBenchmark: 'Basel III minimum: 4.5%. Well-capitalized: ≥6.5%. Plus G-SIB surcharge (1%–3.5%).',
  },
  'Efficiency Ratio': {
    definition: 'Non-interest expense divided by total revenue (net interest income + non-interest income). Lower is better — indicates cost efficiency.',
    industryStandard: 'Best-in-class: <55%. Average: 55%–65%. Weak: >70%.',
    regulatoryBenchmark: 'No regulatory threshold, but examiners monitor as an earnings quality indicator.',
  },
  'NPL Ratio': {
    definition: 'Non-performing loans (90+ days past due or on non-accrual) as a percentage of total loans. Measures credit quality.',
    industryStandard: 'Strong: <0.5%. Acceptable: 0.5%–1.5%. Elevated: >2.0%.',
    regulatoryBenchmark: 'OCC/FDIC flag ratios >2% for enhanced monitoring. Directly impacts CAMELS Asset Quality (A) rating.',
  },
  'Liquidity Coverage Ratio': {
    definition: 'High-quality liquid assets divided by projected net cash outflows over a 30-day stress scenario.',
    industryStandard: 'Most large banks hold 110%–150%. Excess liquidity buffers are common post-2008.',
    regulatoryBenchmark: 'Basel III minimum: ≥100%. U.S. G-SIBs subject to full LCR requirement.',
  },
  'Tier 1 Leverage Ratio': {
    definition: 'Tier 1 capital divided by average total consolidated assets (not risk-weighted). A simpler measure of capital adequacy.',
    industryStandard: 'Large banks typically maintain 7%–10%. Community banks: 8%–12%.',
    regulatoryBenchmark: 'Well-capitalized: ≥5%. Adequately capitalized: ≥4%. Supplementary leverage ratio for G-SIBs: ≥3%.',
  },
  'Total Capital Ratio': {
    definition: 'Total regulatory capital (Tier 1 + Tier 2) as a percentage of risk-weighted assets. The broadest measure of a bank\'s capital cushion.',
    industryStandard: 'G-SIBs typically maintain 15%–19%. U.S. bank median: ~13%–16%.',
    regulatoryBenchmark: 'Well-capitalized: ≥10%. Adequately capitalized: ≥8%. Basel III minimum: 8%.',
  },
  'Total Assets': {
    definition: 'The sum of all assets held by the institution, including loans, securities, cash, and other assets. Indicates the overall size of the bank.',
    industryStandard: 'G-SIBs: >$250B. Large regionals: $50B–$250B. Community banks: <$10B.',
    regulatoryBenchmark: 'Banks with ≥$250B in total assets are subject to enhanced prudential standards (Category I–III). $100B+ triggers heightened supervision.',
  },
};
interface BankMetricCardProps {
  metric: BankMetric;
  isRealTime?: boolean;
}

export function BankMetricCard({ metric, isRealTime = false }: BankMetricCardProps) {
  const getStatusIcon = () => {
    if (!metric.threshold) return null;
    
    const icon = (() => {
      switch (metric.threshold.status) {
        case 'good':
          return <CheckCircle2 className="w-4 h-4 text-success" />;
        case 'warning':
          return <AlertTriangle className="w-4 h-4 text-warning" />;
        case 'critical':
          return <XCircle className="w-4 h-4 text-destructive" />;
        default:
          return null;
      }
    })();

    if (!icon) return null;

    if (metric.threshold.context) {
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{icon}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {metric.threshold.context}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return icon;
  };

  const getStatusBorder = () => {
    if (!metric.threshold) return '';
    
    switch (metric.threshold.status) {
      case 'good':
        return 'border-l-4 border-l-success';
      case 'warning':
        return 'border-l-4 border-l-warning';
      case 'critical':
        return 'border-l-4 border-l-destructive';
      default:
        return '';
    }
  };

  return (
    <div className={`glass-card rounded-lg p-5 transition-all duration-300 hover:glow-border ${getStatusBorder()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            {metric.label}
          </span>
          {metricReference[metric.label] && (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="cursor-help focus:outline-none">
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-primary transition-colors" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="max-w-sm p-3 space-y-2 z-[100]">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-0.5">Definition</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{metricReference[metric.label].definition}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-0.5">Industry Standard</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{metricReference[metric.label].industryStandard}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-0.5">Regulatory Benchmark</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{metricReference[metric.label].regulatoryBenchmark}</p>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {getStatusIcon()}
        </div>
        {isRealTime && (
          <Badge variant="success" className="flex items-center gap-1 text-[10px] px-1.5 py-0.5">
            <Wifi className="w-2.5 h-2.5" />
            Live
          </Badge>
        )}
      </div>

      <div className="mb-3">
        <span className="metric-value text-3xl text-foreground">{metric.value}</span>
        <div className="flex items-center gap-1 mt-1">
          {metric.change > 0 ? (
            <ArrowUp className="w-3 h-3 text-success" />
          ) : metric.change < 0 ? (
            <ArrowDown className="w-3 h-3 text-destructive" />
          ) : null}
          <span className={`text-xs ${metric.change > 0 ? 'text-success' : metric.change < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {metric.change > 0 ? '+' : ''}{metric.change}% {metric.changeLabel}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {metric.description}
      </p>
      
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <span className="source-tag px-2 py-0.5 rounded text-muted-foreground text-xs">
            {metric.source}
          </span>
          <span className="text-xs text-muted-foreground">
            {metric.reportType}
          </span>
        </div>
        <a 
          href={metric.sourceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}