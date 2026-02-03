import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { executiveInsights, mizuhoMetrics } from '@/data/dataSources';
import { BankMetricCard } from './BankMetricCard';

export function ExecutiveSummary() {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'attention':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'opportunity':
        return <Lightbulb className="w-5 h-5 text-primary" />;
      case 'risk':
        return <ShieldAlert className="w-5 h-5 text-destructive" />;
      default:
        return <TrendingUp className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'strength':
        return 'border-l-success bg-success/5';
      case 'attention':
        return 'border-l-warning bg-warning/5';
      case 'opportunity':
        return 'border-l-primary bg-primary/5';
      case 'risk':
        return 'border-l-destructive bg-destructive/5';
      default:
        return 'border-l-muted bg-muted/5';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'strength':
        return 'Strength';
      case 'attention':
        return 'Attention';
      case 'opportunity':
        return 'Opportunity';
      case 'risk':
        return 'Risk';
      default:
        return category;
    }
  };

  const strengths = executiveInsights.filter(i => i.category === 'strength');
  const attentionItems = executiveInsights.filter(i => i.category === 'attention' || i.category === 'risk');
  const opportunities = executiveInsights.filter(i => i.category === 'opportunity');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Executive Insights Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Executive Summary</h2>
        <p className="text-muted-foreground">
          Key insights derived from FFIEC, FRED, and NIC regulatory filings as of Q4 2023
        </p>
      </div>

      {/* Insights Grid */}
      <div className="space-y-6">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <h3 className="text-sm font-semibold text-success uppercase tracking-wide">Strengths</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strengths.map((insight) => (
                <div
                  key={insight.id}
                  className={`glass-card rounded-lg p-5 border-l-4 ${getCategoryStyle(insight.category)} hover:glow-border transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(insight.category)}
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {getCategoryLabel(insight.category)}
                      </span>
                    </div>
                    {insight.metric && (
                      <span className="metric-value text-xl text-foreground">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {insight.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="source-tag px-2 py-0.5 rounded">{insight.source}</span>
                    <span>•</span>
                    <span>{insight.reportType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attention & Risks */}
        {attentionItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold text-warning uppercase tracking-wide">Requires Attention</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attentionItems.map((insight) => (
                <div
                  key={insight.id}
                  className={`glass-card rounded-lg p-5 border-l-4 ${getCategoryStyle(insight.category)} hover:glow-border transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(insight.category)}
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {getCategoryLabel(insight.category)}
                      </span>
                    </div>
                    {insight.metric && (
                      <span className="metric-value text-xl text-foreground">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {insight.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="source-tag px-2 py-0.5 rounded">{insight.source}</span>
                    <span>•</span>
                    <span>{insight.reportType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Opportunities</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((insight) => (
                <div
                  key={insight.id}
                  className={`glass-card rounded-lg p-5 border-l-4 ${getCategoryStyle(insight.category)} hover:glow-border transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(insight.category)}
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {getCategoryLabel(insight.category)}
                      </span>
                    </div>
                    {insight.metric && (
                      <span className="metric-value text-xl text-foreground">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {insight.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="source-tag px-2 py-0.5 rounded">{insight.source}</span>
                    <span>•</span>
                    <span>{insight.reportType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Institution Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Institution Metrics</h2>
            <p className="text-sm text-muted-foreground">
              Key performance indicators from regulatory filings
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mizuhoMetrics.map((metric) => (
            <BankMetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>
    </div>
  );
}
