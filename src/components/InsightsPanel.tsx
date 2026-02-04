import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { dataIngestionApi, ReportInsight, IngestedReport } from '@/lib/api/dataIngestion';

const INSIGHT_TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  summary: { icon: FileText, color: 'text-primary', label: 'Summary' },
  metric_extraction: { icon: BarChart3, color: 'text-blue-500', label: 'Metrics' },
  risk_assessment: { icon: AlertTriangle, color: 'text-warning', label: 'Risks' },
  trend_analysis: { icon: TrendingUp, color: 'text-success', label: 'Trends' },
  recommendation: { icon: Lightbulb, color: 'text-purple-500', label: 'Recommendations' },
};

const CATEGORY_COLORS: Record<string, string> = {
  capital: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  liquidity: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  profitability: 'bg-green-500/10 text-green-500 border-green-500/20',
  asset_quality: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  compliance: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  general: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

interface InsightsPanelProps {
  selectedReportId?: string;
}

export function InsightsPanel({ selectedReportId }: InsightsPanelProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['report-insights', selectedReportId],
    queryFn: () => dataIngestionApi.getInsights(selectedReportId),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['ingested-reports'],
    queryFn: () => dataIngestionApi.getReports(),
  });

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedInsights(newExpanded);
  };

  // Group insights by report
  const insightsByReport = insights.reduce((acc, insight) => {
    const reportId = insight.report_id;
    if (!acc[reportId]) {
      acc[reportId] = [];
    }
    acc[reportId].push(insight);
    return acc;
  }, {} as Record<string, ReportInsight[]>);

  // Group insights by type for display
  const insightsByType = insights.reduce((acc, insight) => {
    const type = insight.insight_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(insight);
    return acc;
  }, {} as Record<string, ReportInsight[]>);

  if (insightsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-muted-foreground">
            Loading insights...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No insights yet</p>
            <p className="text-sm mt-1">Upload and analyze reports to generate AI insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(insightsByType).slice(0, 4).map(([type, typeInsights]) => {
          const config = INSIGHT_TYPE_CONFIG[type] || INSIGHT_TYPE_CONFIG.summary;
          const Icon = config.icon;
          return (
            <Card key={type} className="p-3">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                  <p className="text-lg font-semibold">{typeInsights.length}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Insights by Type */}
      {Object.entries(insightsByType).map(([type, typeInsights]) => {
        const config = INSIGHT_TYPE_CONFIG[type] || INSIGHT_TYPE_CONFIG.summary;
        const Icon = config.icon;

        return (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className={`w-4 h-4 ${config.color}`} />
                {config.label}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {typeInsights.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {typeInsights.map((insight) => {
                const isExpanded = expandedInsights.has(insight.id);
                const report = reports.find(r => r.id === insight.report_id);
                const categoryClass = CATEGORY_COLORS[insight.category || 'general'] || CATEGORY_COLORS.general;

                return (
                  <Collapsible key={insight.id} open={isExpanded} onOpenChange={() => toggleExpand(insight.id)}>
                    <CollapsibleTrigger className="w-full text-left">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        <div className="mt-0.5">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{insight.title}</span>
                            {insight.category && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryClass}`}>
                                {insight.category}
                              </Badge>
                            )}
                            {insight.confidence_score && insight.confidence_score >= 0.9 && (
                              <CheckCircle2 className="w-3 h-3 text-success ml-auto" />
                            )}
                          </div>
                          {report && (
                            <p className="text-xs text-muted-foreground truncate">
                              From: {report.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-7 mt-2 p-3 bg-background rounded-lg border border-border/50">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {insight.content}
                        </p>
                        {insight.metrics && Object.keys(insight.metrics).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Extracted Metrics:</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(insight.metrics).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key.replace(/_/g, ' ')}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {insight.confidence_score && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Confidence: {(insight.confidence_score * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
