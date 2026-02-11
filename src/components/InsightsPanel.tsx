import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  FileText,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { dataIngestionApi, ReportInsight } from '@/lib/api/dataIngestion';

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string; bg: string }> = {
  summary: { icon: FileText, label: 'Summary', color: 'text-primary', bg: 'bg-primary/10' },
  metric_extraction: { icon: BarChart3, label: 'Metrics', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  risk_assessment: { icon: ShieldAlert, label: 'Risk', color: 'text-destructive', bg: 'bg-destructive/10' },
  trend_analysis: { icon: TrendingUp, label: 'Trend', color: 'text-success', bg: 'bg-success/10' },
  recommendation: { icon: Lightbulb, label: 'Action', color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

const CATEGORY_COLORS: Record<string, string> = {
  capital: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  leverage: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  liquidity: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  liquidity_risk: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  profitability: 'bg-green-500/10 text-green-500 border-green-500/20',
  financial_performance: 'bg-green-500/10 text-green-500 border-green-500/20',
  asset_quality: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  compliance: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  strategic_planning: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  growth: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  general: 'bg-muted text-muted-foreground border-border',
};

/**
 * Filter out low-substance insights:
 * - Content wrapped in brackets (template/placeholder text)
 * - Very short content (<60 chars) that's just a label
 * - Content that's purely generic without data points
 */
function isSubstantive(insight: ReportInsight): boolean {
  const content = insight.content.trim();
  // Reject bracketed placeholder text like "[Analysis of ...]"
  if (/^\[.*\]$/.test(content)) return false;
  // Reject very short generic statements
  if (content.length < 60 && !/\d/.test(content)) return false;
  // Reject content that's purely a description of what should be analyzed
  if (/^Analysis of\b/i.test(content) && content.length < 100) return false;
  return true;
}

function getConfidenceColor(score: number): string {
  if (score >= 0.9) return 'text-success';
  if (score >= 0.7) return 'text-warning';
  return 'text-muted-foreground';
}

interface InsightsPanelProps {
  selectedReportId?: string;
}

export function InsightsPanel({ selectedReportId }: InsightsPanelProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['report-insights', selectedReportId],
    queryFn: () => dataIngestionApi.getInsights(selectedReportId),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['ingested-reports'],
    queryFn: () => dataIngestionApi.getReports(),
  });

  const toggleExpand = (id: string) => {
    setExpandedInsights((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Filter to substantive insights only
  const substantiveInsights = insights.filter(isSubstantive);
  const filteredCount = insights.length - substantiveInsights.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-muted-foreground">Loading insights...</div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No insights yet</p>
          <p className="text-sm mt-1">Upload and analyze reports to generate AI insights</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by confidence descending
  const sorted = [...substantiveInsights].sort((a, b) => (b.confidence_score ?? 0) - (a.confidence_score ?? 0));

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>{substantiveInsights.length} actionable insights</span>
        {filteredCount > 0 && (
          <span>{filteredCount} low-substance items filtered</span>
        )}
      </div>

      {/* Flat list of insights */}
      {sorted.map((insight) => {
        const isExpanded = expandedInsights.has(insight.id);
        const config = TYPE_CONFIG[insight.insight_type] || TYPE_CONFIG.summary;
        const Icon = config.icon;
        const report = reports.find((r) => r.id === insight.report_id);
        const catClass = CATEGORY_COLORS[insight.category || 'general'] || CATEGORY_COLORS.general;

        return (
          <Collapsible key={insight.id} open={isExpanded} onOpenChange={() => toggleExpand(insight.id)}>
            <CollapsibleTrigger className="w-full text-left">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-secondary/30 transition-colors">
                {/* Type icon */}
                <div className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${config.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{insight.title}</span>
                    {insight.category && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${catClass}`}>
                        {(insight.category || '').replace(/_/g, ' ')}
                      </Badge>
                    )}
                    {insight.confidence_score != null && (
                      <span className={`text-[10px] font-medium ml-auto ${getConfidenceColor(insight.confidence_score)}`}>
                        {(insight.confidence_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Preview of content */}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {insight.content}
                  </p>

                  {/* Report source + expand hint */}
                  <div className="flex items-center gap-2 mt-1.5">
                    {report && (
                      <span className="text-[10px] text-muted-foreground/70 truncate max-w-[200px]">
                        {report.name}
                      </span>
                    )}
                    <ChevronDown className={`w-3 h-3 text-muted-foreground/50 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="ml-10 mt-1 mb-2 p-3 bg-secondary/20 rounded-lg border border-border/30">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {insight.content}
                </p>

                {insight.metrics && Object.keys(insight.metrics).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Extracted Metrics
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(insight.metrics).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs font-mono">
                          {key.replace(/_/g, ' ')}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
