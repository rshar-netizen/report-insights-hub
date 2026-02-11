import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Loader2, FileText, AlertTriangle } from 'lucide-react';
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

  const balanceSheet = useMemo(() => {
    if (!metrics?.total_assets || metrics.total_assets <= 0) return null;

    const totalAssets = metrics.total_assets;

    // Check if we have actual balance sheet line items
    const hasRealBreakdown = !!(
      metrics.total_loans || metrics.total_securities || metrics.total_deposits || metrics.total_equity
    );

    let assets: BalanceSheetItem[];
    let liabilitiesEquity: BalanceSheetItem[];

    if (hasRealBreakdown) {
      // USE ACTUAL REPORTED DATA
      const assetItems: { name: string; value: number; color: string }[] = [];
      
      if (metrics.cash_and_due && metrics.cash_and_due > 0) {
        assetItems.push({ name: 'Cash & Due from Banks', value: metrics.cash_and_due, color: 'hsl(var(--primary))' });
      }
      if (metrics.total_securities && metrics.total_securities > 0) {
        assetItems.push({ name: 'Securities', value: metrics.total_securities, color: 'hsl(var(--chart-2, 200 70% 50%))' });
      }
      if (metrics.trading_assets && metrics.trading_assets > 0) {
        assetItems.push({ name: 'Trading Assets', value: metrics.trading_assets, color: 'hsl(var(--chart-3, 270 60% 55%))' });
      }
      if (metrics.total_loans && metrics.total_loans > 0) {
        assetItems.push({ name: 'Loans & Leases', value: metrics.total_loans, color: 'hsl(var(--chart-4, 340 65% 55%))' });
      }
      
      // Calculate "other" as remainder
      const knownAssets = assetItems.reduce((s, a) => s + a.value, 0);
      const otherAssetVal = metrics.other_assets && metrics.other_assets > 0 
        ? metrics.other_assets 
        : Math.max(0, totalAssets - knownAssets);
      if (otherAssetVal > 0) {
        assetItems.push({ name: 'Other Assets', value: otherAssetVal, color: 'hsl(var(--muted-foreground))' });
      }

      assets = assetItems.map(a => ({
        ...a,
        displayValue: formatCurrency(a.value),
        percentage: (a.value / totalAssets) * 100,
      }));

      // Liabilities & Equity
      const liabItems: { name: string; value: number; color: string }[] = [];

      if (metrics.total_deposits && metrics.total_deposits > 0) {
        liabItems.push({ name: 'Deposits', value: metrics.total_deposits, color: 'hsl(var(--destructive))' });
      }
      if (metrics.total_borrowings && metrics.total_borrowings > 0) {
        liabItems.push({ name: 'Borrowings', value: metrics.total_borrowings, color: 'hsl(var(--warning, 38 92% 50%))' });
      }
      if (metrics.subordinated_debt && metrics.subordinated_debt > 0) {
        liabItems.push({ name: 'Subordinated Debt', value: metrics.subordinated_debt, color: 'hsl(var(--chart-3, 270 60% 55%))' });
      }

      // Other liabilities
      const knownLiab = liabItems.reduce((s, l) => s + l.value, 0);
      const totalLiab = metrics.total_liabilities || (totalAssets - (metrics.total_equity || 0));
      const otherLiabVal = metrics.other_liabilities && metrics.other_liabilities > 0
        ? metrics.other_liabilities
        : Math.max(0, totalLiab - knownLiab);
      if (otherLiabVal > 0) {
        liabItems.push({ name: 'Other Liabilities', value: otherLiabVal, color: 'hsl(var(--muted-foreground))' });
      }

      if (metrics.total_equity && metrics.total_equity > 0) {
        liabItems.push({ name: 'Total Equity', value: metrics.total_equity, color: 'hsl(var(--success, 142 71% 45%))' });
      }

      liabilitiesEquity = liabItems.map(l => ({
        ...l,
        displayValue: formatCurrency(l.value),
        percentage: (l.value / totalAssets) * 100,
      }));
    } else {
      // ESTIMATED — derive from capital ratios only
      const tier1LeverageRatio = (metrics.tier1_leverage_ratio || 0) / 100;
      const totalCapitalRatio = (metrics.total_capital_ratio || 0) / 100;
      const tier1Ratio = (metrics.tier1_capital_ratio || 0) / 100;

      const tier1Capital = tier1LeverageRatio > 0 
        ? tier1LeverageRatio * totalAssets 
        : tier1Ratio * totalAssets * 0.7;

      const rwa = tier1LeverageRatio > 0 && tier1Ratio > 0
        ? tier1Capital / tier1Ratio
        : totalAssets * 0.7;
      const totalCapital = totalCapitalRatio > 0 
        ? totalCapitalRatio * rwa 
        : tier1Capital * 1.05;

      const totalLiabilities = totalAssets - totalCapital;

      assets = [
        { name: 'Cash & Securities', value: totalAssets * 0.35, displayValue: formatCurrency(totalAssets * 0.35), percentage: 35, color: 'hsl(var(--primary))' },
        { name: 'Loans & Leases', value: totalAssets * 0.45, displayValue: formatCurrency(totalAssets * 0.45), percentage: 45, color: 'hsl(var(--chart-2, 200 70% 50%))' },
        { name: 'Other Assets', value: totalAssets * 0.20, displayValue: formatCurrency(totalAssets * 0.20), percentage: 20, color: 'hsl(var(--muted-foreground))' },
      ];

      liabilitiesEquity = [
        { name: 'Deposits', value: totalLiabilities * 0.55, displayValue: formatCurrency(totalLiabilities * 0.55), percentage: (totalLiabilities * 0.55 / totalAssets) * 100, color: 'hsl(var(--destructive))' },
        { name: 'Borrowings', value: totalLiabilities * 0.30, displayValue: formatCurrency(totalLiabilities * 0.30), percentage: (totalLiabilities * 0.30 / totalAssets) * 100, color: 'hsl(var(--warning, 38 92% 50%))' },
        { name: 'Other Liabilities', value: totalLiabilities * 0.15, displayValue: formatCurrency(totalLiabilities * 0.15), percentage: (totalLiabilities * 0.15 / totalAssets) * 100, color: 'hsl(var(--muted-foreground))' },
        { name: 'Total Equity', value: totalCapital, displayValue: formatCurrency(totalCapital), percentage: (totalCapital / totalAssets) * 100, color: 'hsl(var(--success, 142 71% 45%))' },
      ];
    }

    return { totalAssets, assets, liabilitiesEquity, hasRealBreakdown };
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
        <p className="text-muted-foreground">Upload a Call Report or UBPR to view balance sheet structure.</p>
      </div>
    );
  }

  const { totalAssets, assets, liabilitiesEquity, hasRealBreakdown } = balanceSheet;

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

      {!hasRealBreakdown && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning" />
          <p className="italic">
            Sub-category splits are estimated. Re-analyze your UBPR or Call Report to extract actual balance sheet line items.
          </p>
        </div>
      )}
    </div>
  );
}