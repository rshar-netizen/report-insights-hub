import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Info, Loader2, FileText } from 'lucide-react';
import { useAllReportMetrics } from '@/hooks/useIngestedReportData';

interface BalanceSheetItem {
  name: string;
  value: number;
  displayValue: string;
  percentage: number;
  color: string;
}

const formatCurrency = (val: number): string => {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
};

export function FinancialPositionChart() {
  const { metrics, isLoading, hasData } = useAllReportMetrics();

  // Derive balance sheet structure from available metrics
  const balanceSheet = useMemo(() => {
    if (!metrics?.total_assets || metrics.total_assets <= 0) return null;

    const totalAssets = metrics.total_assets;
    // Use capital ratios to estimate equity portion
    // Total Capital Ratio = Total Capital / RWA, Leverage Ratio = Tier 1 / Total Assets
    const tier1LeverageRatio = (metrics.tier1_leverage_ratio || 0) / 100;
    const totalCapitalRatio = (metrics.total_capital_ratio || 0) / 100;
    const cet1Ratio = (metrics.common_equity_tier1_ratio || metrics.cet1_ratio || 0) / 100;
    const tier1Ratio = (metrics.tier1_capital_ratio || 0) / 100;

    // Tier 1 Leverage Ratio = Tier 1 Capital / Total Assets → Tier 1 Capital = ratio × assets
    const tier1Capital = tier1LeverageRatio > 0 
      ? tier1LeverageRatio * totalAssets 
      : tier1Ratio * totalAssets * 0.7; // estimate RWA ~70% of assets

    // CET1 = Tier1 if no AT1 (which is the case for Mizuho)
    const cet1Capital = cet1Ratio === tier1Ratio 
      ? tier1Capital 
      : cet1Ratio * totalAssets * 0.7;
    
    const at1Capital = tier1Capital - cet1Capital;

    // Total Capital includes Tier 2
    const rwa = tier1LeverageRatio > 0 && tier1Ratio > 0
      ? tier1Capital / tier1Ratio
      : totalAssets * 0.7;
    const totalCapital = totalCapitalRatio > 0 
      ? totalCapitalRatio * rwa 
      : tier1Capital * 1.05;
    const tier2Capital = totalCapital - tier1Capital;

    const totalEquity = totalCapital;
    const totalLiabilities = totalAssets - totalEquity;

    // Asset-side breakdown (estimated structure for a wholesale bank)
    const cashSecurities = totalAssets * 0.35;
    const loans = totalAssets * 0.45;
    const otherAssets = totalAssets * 0.20;

    // Liability breakdown
    const deposits = totalLiabilities * 0.55;
    const borrowings = totalLiabilities * 0.30;
    const otherLiabilities = totalLiabilities * 0.15;

    return {
      totalAssets,
      assets: [
        { name: 'Cash & Securities', value: cashSecurities, displayValue: formatCurrency(cashSecurities), percentage: (cashSecurities / totalAssets) * 100, color: 'hsl(var(--primary))' },
        { name: 'Loans & Leases', value: loans, displayValue: formatCurrency(loans), percentage: (loans / totalAssets) * 100, color: 'hsl(var(--chart-2, 200 70% 50%))' },
        { name: 'Other Assets', value: otherAssets, displayValue: formatCurrency(otherAssets), percentage: (otherAssets / totalAssets) * 100, color: 'hsl(var(--chart-3, 270 60% 55%))' },
      ] as BalanceSheetItem[],
      liabilitiesEquity: [
        { name: 'Deposits', value: deposits, displayValue: formatCurrency(deposits), percentage: (deposits / totalAssets) * 100, color: 'hsl(var(--destructive))' },
        { name: 'Borrowings', value: borrowings, displayValue: formatCurrency(borrowings), percentage: (borrowings / totalAssets) * 100, color: 'hsl(var(--warning, 38 92% 50%))' },
        { name: 'Other Liabilities', value: otherLiabilities, displayValue: formatCurrency(otherLiabilities), percentage: (otherLiabilities / totalAssets) * 100, color: 'hsl(var(--chart-4, 340 65% 55%))' },
        { name: 'Tier 2 Capital', value: tier2Capital, displayValue: formatCurrency(tier2Capital), percentage: (tier2Capital / totalAssets) * 100, color: 'hsl(var(--chart-5, 160 60% 45%))' },
        { name: 'CET1 / Tier 1 Capital', value: cet1Capital, displayValue: formatCurrency(cet1Capital), percentage: (cet1Capital / totalAssets) * 100, color: 'hsl(var(--success, 142 71% 45%))' },
      ] as BalanceSheetItem[],
      capitalBreakdown: {
        cet1Capital,
        at1Capital,
        tier2Capital,
        totalCapital,
        tier1Capital,
        cet1Ratio: (cet1Ratio * 100),
        tier1Ratio: (tier1Ratio * 100),
        totalCapitalRatio: (totalCapitalRatio * 100),
      }
    };
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading financial position data...</span>
      </div>
    );
  }

  if (!hasData || !balanceSheet) {
    return (
      <div className="bg-muted/30 border border-border rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Upload a Call Report to view balance sheet structure.</p>
      </div>
    );
  }

  const { totalAssets, assets, liabilitiesEquity, capitalBreakdown } = balanceSheet;

  // Stacked bar data for side-by-side comparison
  const stackedData = [
    { 
      side: 'Assets',
      ...Object.fromEntries(assets.map(a => [a.name, a.value]))
    },
    { 
      side: 'Liabilities & Equity',
      ...Object.fromEntries(liabilitiesEquity.map(l => [l.name, l.value]))
    }
  ];

  // Capital structure pie chart data
  const capitalPieData = [
    { name: 'CET1 Capital', value: capitalBreakdown.cet1Capital, fill: 'hsl(var(--success, 142 71% 45%))' },
    ...(capitalBreakdown.at1Capital > 100 ? [{ name: 'AT1 Capital', value: capitalBreakdown.at1Capital, fill: 'hsl(var(--warning, 38 92% 50%))' }] : []),
    { name: 'Tier 2 Capital', value: capitalBreakdown.tier2Capital, fill: 'hsl(var(--chart-5, 160 60% 45%))' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const allBarKeys = [...assets.map(a => a.name), ...liabilitiesEquity.map(l => l.name)];
  const colorMap: Record<string, string> = {};
  assets.forEach(a => { colorMap[a.name] = a.color; });
  liabilitiesEquity.forEach(l => { colorMap[l.name] = l.color; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Financial Position</h2>
          <p className="text-sm text-muted-foreground">
            Balance sheet structure — Total Assets: {formatCurrency(totalAssets)}
          </p>
        </div>
      </div>

      <div className="glass-card rounded-lg p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Assets vs Liabilities & Equity</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  type="number" 
                  tickFormatter={(v) => formatCurrency(v)} 
                  className="text-xs fill-muted-foreground"
                />
                <YAxis 
                  type="category" 
                  dataKey="side" 
                  width={140} 
                  className="text-xs fill-muted-foreground" 
                />
                <Tooltip content={<CustomTooltip />} />
                {allBarKeys.map((key) => (
                  <Bar key={key} dataKey={key} stackId="a" fill={colorMap[key]} radius={0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            {[...assets, ...liabilitiesEquity].map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium text-foreground">{item.displayValue}</span>
              </div>
            ))}
          </div>
        </div>

      {/* CET1 = Tier1 explanation */}
      {capitalBreakdown.cet1Ratio === capitalBreakdown.tier1Ratio && capitalBreakdown.cet1Ratio > 0 && (
        <div className="p-3 rounded-md bg-primary/5 border border-primary/10">
          <div className="flex gap-2 text-xs">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">Why CET1 = Tier 1 at {capitalBreakdown.cet1Ratio.toFixed(2)}%?</p>
              <p className="text-muted-foreground leading-relaxed">
                Mizuho holds <strong>no Additional Tier 1 (AT1) capital</strong> — no preferred stock or contingent convertibles. 
                All Tier 1 capital is Common Equity, which is typical for foreign bank subsidiaries funded purely by the parent.
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground italic">
        Note: Total assets ({formatCurrency(totalAssets)}) and capital ratios are from ingested reports. 
        Sub-category splits (loans, deposits, etc.) are estimated — upload Schedule RC for exact line-item breakdowns.
      </p>
    </div>
  );
}