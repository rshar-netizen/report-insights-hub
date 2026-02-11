import { useState, useMemo } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, FileText, Calendar, AlertTriangle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIngestedHistoricalData } from '@/hooks/useIngestedReportData';

// Metric metadata (labels, descriptions) — no fake values
const metricMeta: Record<string, { label: string; description: string; lowerIsBetter?: boolean }> = {
  nim: { label: 'Net Interest Margin', description: 'Difference between interest income and interest paid, relative to assets.' },
  roa: { label: 'Return on Assets (ROA)', description: 'Net income as a percentage of average total assets.' },
  roe: { label: 'Return on Equity (ROE)', description: 'Net income as a percentage of average total equity.' },
  efficiency: { label: 'Efficiency Ratio', description: 'Non-interest expenses divided by revenue. Lower is better.', lowerIsBetter: true },
  npl: { label: 'NPL Ratio', description: 'Non-performing loans as a percentage of total loans.', lowerIsBetter: true },
};

interface MetricTrendTrackerProps {
  className?: string;
}

export function MetricTrendTracker({ className }: MetricTrendTrackerProps) {
  const { historicalData, isLoading, hasData } = useIngestedHistoricalData();

  // Determine which metrics actually have real data
  const availableMetrics = useMemo(() => {
    return Object.keys(historicalData)
      .filter(key => historicalData[key]?.length > 0 && metricMeta[key])
      .map(key => ({ id: key, ...metricMeta[key] }));
  }, [historicalData]);

  const [selectedMetric, setSelectedMetric] = useState<string>('nim');

  // Auto-select first available metric if current selection has no data
  const activeMetric = useMemo(() => {
    if (availableMetrics.find(m => m.id === selectedMetric)) return selectedMetric;
    return availableMetrics[0]?.id || selectedMetric;
  }, [availableMetrics, selectedMetric]);

  const meta = metricMeta[activeMetric];
  const data = historicalData[activeMetric] || [];
  const isPositiveGood = !meta?.lowerIsBetter;

  // No data state
  if (!isLoading && (!hasData || availableMetrics.length === 0)) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Performance Tracking</h2>
          <p className="text-sm text-muted-foreground">Quarter-over-quarter self comparison from ingested reports</p>
        </div>
        <div className="bg-muted/30 border border-border rounded-lg p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Historical Data Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload and analyze regulatory reports (FDIC Financials, Call Reports) in the Data Ingestion tab 
            to track performance trends over time.
          </p>
        </div>
      </div>
    );
  }

  const latestValue = data[data.length - 1]?.value ?? 0;
  const previousValue = data[data.length - 2]?.value ?? 0;
  const change = latestValue - previousValue;
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100).toFixed(2) : '0';

  const isChangePositive = change > 0;
  const isGoodChange = isPositiveGood ? isChangePositive : !isChangePositive;

  // Y-axis bounds
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.2 || 0.5;
  const yMin = Math.max(0, minValue - padding);
  const yMax = maxValue + padding;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Performance Tracking</h2>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
              <FileText className="w-3 h-3" />
              Real Data
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Historical data from ingested regulatory reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Metric Selector — only metrics with real data */}
          <Select value={activeMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[200px] bg-secondary border-border">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {availableMetrics.map(metric => (
                <SelectItem key={metric.id} value={metric.id}>
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="glass-card rounded-lg p-6">
        {/* Metric Summary */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {meta?.label || activeMetric}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {meta?.description}
            </p>
            <p className="text-xs text-primary mt-1">
              Source: Ingested Reports (FDIC)
            </p>
          </div>
          <div className="text-right">
            <div className="metric-value text-3xl text-foreground">
              {latestValue.toFixed(2)}%
            </div>
            {data.length >= 2 && (
              <>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {isGoodChange ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-sm font-medium ${isGoodChange ? 'text-success' : 'text-destructive'}`}>
                    {change > 0 ? '+' : ''}{change.toFixed(2)}% ({changePercent}%)
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  vs previous quarter
                </span>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="period" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                domain={[yMin, yMax]}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(222 47% 10%)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-card)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(173 80% 45%)' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, meta?.label || activeMetric]}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(173 80% 45%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(173 80% 45%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(173 80% 55%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Source Attribution */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Data Sources</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                Real
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>From ingested regulatory reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Breakdown Table — Collapsible */}
      <Collapsible>
        <div className="glass-card rounded-lg overflow-hidden">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors cursor-pointer">
            <h3 className="text-sm font-semibold text-foreground">Quarterly Breakdown</h3>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Period</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Value</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Change</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data].reverse().map((row, idx, arr) => {
                    const prevRow = arr[idx + 1];
                    const rowChange = prevRow ? row.value - prevRow.value : 0;
                    const isRowChangeGood = isPositiveGood ? rowChange > 0 : rowChange < 0;

                    return (
                      <tr key={row.period} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{row.period}</td>
                        <td className="px-4 py-3 text-sm text-right metric-value text-foreground">
                          {row.value.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {prevRow ? (
                            <span className={`flex items-center justify-end gap-1 ${isRowChangeGood ? 'text-success' : 'text-destructive'}`}>
                              {rowChange > 0 ? '+' : ''}{rowChange.toFixed(2)}%
                              {isRowChangeGood ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {row.reportType}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
