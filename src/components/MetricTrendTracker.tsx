import { useState } from 'react';
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
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, ExternalLink, FileText, Calendar } from 'lucide-react';
import { metricHistoricalData, MetricHistoricalData } from '@/data/dataSources';

interface MetricTrendTrackerProps {
  className?: string;
}

export function MetricTrendTracker({ className }: MetricTrendTrackerProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('nim');
  const [timeframe, setTimeframe] = useState<'quarterly' | 'yearly'>('quarterly');

  const currentMetric = metricHistoricalData.find(m => m.id === selectedMetric);
  
  if (!currentMetric) return null;

  const data = timeframe === 'quarterly' 
    ? currentMetric.quarterlyData 
    : currentMetric.yearlyData;

  const latestValue = data[data.length - 1]?.value ?? 0;
  const previousValue = data[data.length - 2]?.value ?? 0;
  const change = latestValue - previousValue;
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100).toFixed(2) : '0';

  // Determine if positive change is good based on metric type
  const isPositiveGood = !['efficiency', 'npl'].includes(selectedMetric);
  const isChangePositive = change > 0;
  const isGoodChange = isPositiveGood ? isChangePositive : !isChangePositive;

  // Calculate min/max for Y-axis with padding
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.2;
  const yMin = Math.max(0, minValue - padding);
  const yMax = maxValue + padding;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Performance Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Quarter-over-quarter and year-over-year self comparison
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
            <button
              onClick={() => setTimeframe('quarterly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeframe === 'quarterly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Q-o-Q
            </button>
            <button
              onClick={() => setTimeframe('yearly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeframe === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Y-o-Y
            </button>
          </div>

          {/* Metric Selector */}
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[200px] bg-secondary border-border">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {metricHistoricalData.map(metric => (
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
              {currentMetric.label}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {currentMetric.description}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="metric-value text-3xl text-foreground">
                {latestValue.toFixed(2)}%
              </div>
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
                vs {timeframe === 'quarterly' ? 'previous quarter' : 'previous year'}
              </span>
            </div>
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
              {currentMetric.peerMedian && (
                <ReferenceLine 
                  y={currentMetric.peerMedian} 
                  stroke="hsl(var(--warning))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Peer Median: ${currentMetric.peerMedian}%`, 
                    fill: 'hsl(var(--warning))',
                    fontSize: 11,
                    position: 'insideTopRight'
                  }}
                />
              )}
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(222 47% 10%)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-card)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(173 80% 45%)' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, currentMetric.label]}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Data Sources</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {currentMetric.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 source-tag px-2 py-1 rounded hover:bg-secondary/80 transition-colors"
                  >
                    <span className="text-muted-foreground">{source.name}</span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="text-muted-foreground/80">{source.reportType}</span>
                    <ExternalLink className="w-3 h-3 text-primary" />
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last updated: {currentMetric.lastUpdated}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Breakdown Table */}
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {timeframe === 'quarterly' ? 'Quarterly' : 'Yearly'} Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Period</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Value</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Change</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Report</th>
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
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.reportType}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
