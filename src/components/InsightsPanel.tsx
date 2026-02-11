import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Lightbulb,
  TrendingUp,
  BarChart3,
  ChevronDown,
  FileText,
  ShieldAlert,
  Check,
  Trash2,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { dataIngestionApi, ReportInsight } from '@/lib/api/dataIngestion';
import { toast } from 'sonner';

const GROUP_CONFIG = {
  summary: { icon: FileText, label: 'Executive Summary', color: 'text-primary', bg: 'bg-primary/10' },
  metric_extraction: { icon: BarChart3, label: 'Key Metrics', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  risk_assessment: { icon: ShieldAlert, label: 'Risk Assessment', color: 'text-destructive', bg: 'bg-destructive/10' },
  trend_analysis: { icon: TrendingUp, label: 'Trends', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  recommendation: { icon: Lightbulb, label: 'Recommendations', color: 'text-purple-500', bg: 'bg-purple-500/10' },
} as const;

type GroupKey = keyof typeof GROUP_CONFIG;

const GROUP_ORDER: GroupKey[] = ['metric_extraction', 'risk_assessment', 'trend_analysis', 'recommendation'];

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
  growth: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10',
  general: 'bg-muted text-muted-foreground border-border',
};

/** Filter out low-substance and outdated insights */
function isSubstantive(insight: ReportInsight): boolean {
  const content = insight.content.trim();
  if (/^\[.*\]$/.test(content)) return false;
  if (content.length < 60 && !/\d/.test(content)) return false;
  if (/^Analysis of\b/i.test(content) && content.length < 100) return false;
  // Filter insights referencing only pre-2015 trends
  const yearMatches = content.match(/\b(19|20)\d{2}\b/g);
  if (yearMatches && yearMatches.length > 0) {
    const years = yearMatches.map(Number);
    if (years.every(y => y < 2015)) return false;
  }
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(GROUP_ORDER));
  const queryClient = useQueryClient();

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['report-insights', selectedReportId],
    queryFn: () => dataIngestionApi.getInsights(selectedReportId),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['ingested-reports'],
    queryFn: () => dataIngestionApi.getReports(),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => dataIngestionApi.updateInsightStatus(id, 'accepted'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-insights'] });
      toast.success('Insight accepted');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dataIngestionApi.deleteInsight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-insights'] });
      toast.success('Insight removed');
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedInsights(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const substantiveInsights = insights.filter(isSubstantive);
  const filteredCount = insights.length - substantiveInsights.length;

  // Group insights by type
  const grouped = GROUP_ORDER.reduce((acc, key) => {
    acc[key] = substantiveInsights
      .filter(i => i.insight_type === key)
      .sort((a, b) => (b.confidence_score ?? 0) - (a.confidence_score ?? 0));
    return acc;
  }, {} as Record<GroupKey, ReportInsight[]>);

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

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground px-1">
        <span>{substantiveInsights.length} actionable insights</span>
      </div>

      {GROUP_ORDER.map(groupKey => {
        const items = grouped[groupKey];
        if (!items || items.length === 0) return null;
        const config = GROUP_CONFIG[groupKey];
        const Icon = config.icon;
        const isOpen = expandedGroups.has(groupKey);

        return (
          <Card key={groupKey} className="overflow-hidden">
            <CardHeader
              className="p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${config.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <CardTitle className="text-sm font-semibold flex-1">{config.label}</CardTitle>
                <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>

            {isOpen && (
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {items.map(insight => {
                    const isExpanded = expandedInsights.has(insight.id);
                    const report = reports.find(r => r.id === insight.report_id);
                    const catClass = CATEGORY_COLORS[insight.category || 'general'] || CATEGORY_COLORS.general;
                    const isAccepted = (insight as any).status === 'accepted';
                    const sources = insight.sources as any;

                    return (
                      <Collapsible key={insight.id} open={isExpanded} onOpenChange={() => toggleExpand(insight.id)}>
                        <div className="px-3 py-2.5 hover:bg-secondary/20 transition-colors">
                          <CollapsibleTrigger className="w-full text-left">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm text-foreground">{insight.title}</span>
                                  {insight.category && (
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${catClass}`}>
                                      {(insight.category || '').replace(/_/g, ' ')}
                                    </Badge>
                                  )}
                                  {isAccepted && (
                                    <Badge variant="success" className="text-[10px] px-1.5 py-0">
                                      <Check className="w-2.5 h-2.5 mr-0.5" /> Accepted
                                    </Badge>
                                  )}
                                  {insight.confidence_score != null && (
                                    <span className={`text-[10px] font-medium ml-auto ${getConfidenceColor(insight.confidence_score)}`}>
                                      {(insight.confidence_score * 100).toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {insight.content}
                                </p>

                                {/* Source reference */}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {report && (
                                    <span className="text-[10px] text-muted-foreground/70 truncate max-w-[200px]">
                                      {report.name}
                                    </span>
                                  )}
                                  {sources?.reference && (
                                    <span className="text-[10px] text-primary/70 flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5" />
                                      {sources.reference}
                                    </span>
                                  )}
                                  <ChevronDown className={`w-3 h-3 text-muted-foreground/50 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="mt-2 p-3 bg-secondary/20 rounded-lg border border-border/30">
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

                              {sources?.reference && (
                                <div className="mt-3 pt-3 border-t border-border/30">
                                  <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                                    Source Reference
                                  </p>
                                  <p className="text-xs text-foreground/80 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-primary/60" />
                                    {sources.reference}
                                    {sources.section && ` — ${sources.section}`}
                                  </p>
                                </div>
                              )}

                              {/* Human-in-the-loop actions */}
                              <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2">
                                {!isAccepted && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1"
                                    onClick={(e) => { e.stopPropagation(); acceptMutation.mutate(insight.id); }}
                                    disabled={acceptMutation.isPending}
                                  >
                                    <Check className="w-3 h-3" /> Accept
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(insight.id); }}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-3 h-3" /> Remove
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
