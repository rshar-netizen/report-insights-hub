import { useState } from 'react';
import { 
  dataSources, 
  banks, 
  bankMetrics, 
  marketMetrics, 
  peerComparisonMetrics 
} from '@/data/dataSources';
import { BankMetricCard } from './BankMetricCard';
import { MarketMetricCard } from './MarketMetricCard';
import { PeerComparisonCard } from './PeerComparisonCard';
import { SourceCard } from './SourceCard';
import { BankSelector } from './BankSelector';
import { 
  Activity, 
  Database, 
  FileText, 
  TrendingUp, 
  Building2, 
  Globe, 
  Users,
  BarChart3
} from 'lucide-react';

export function SummaryDashboard() {
  const [selectedBankId, setSelectedBankId] = useState(banks[0].id);
  
  const totalRecords = dataSources.reduce((acc, src) => acc + src.recordCount, 0);
  const activeSources = dataSources.filter((src) => src.status === 'active').length;
  const reportTypes = [...new Set(dataSources.flatMap((src) => src.reportTypes))];
  
  const currentBankMetrics = bankMetrics[selectedBankId] || [];
  const currentPeerMetrics = peerComparisonMetrics[selectedBankId] || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Data Sources</span>
            <p className="metric-value text-2xl text-foreground">{dataSources.length}</p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-success" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Active Sources</span>
            <p className="metric-value text-2xl text-foreground">{activeSources}</p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Total Records</span>
            <p className="metric-value text-2xl text-foreground">
              {totalRecords.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-warning" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Report Types</span>
            <p className="metric-value text-2xl text-foreground">{reportTypes.length}</p>
          </div>
        </div>
      </div>

      {/* Bank Selector */}
      <BankSelector 
        banks={banks} 
        selectedBankId={selectedBankId} 
        onBankChange={setSelectedBankId} 
      />

      {/* Bank-Specific Metrics */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Institution Metrics</h2>
            <p className="text-sm text-muted-foreground">
              Key performance indicators for {banks.find(b => b.id === selectedBankId)?.shortName}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentBankMetrics.map((metric) => (
            <BankMetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>

      {/* Market Metrics */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Market & Economic Indicators</h2>
            <p className="text-sm text-muted-foreground">
              Fed rates, treasury yields, and macroeconomic data affecting all institutions
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketMetrics.map((metric) => (
            <MarketMetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>

      {/* Peer Comparison */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Peer Comparison</h2>
            <p className="text-sm text-muted-foreground">
              How {banks.find(b => b.id === selectedBankId)?.shortName} compares to G-SIB peer group
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentPeerMetrics.map((metric) => (
            <PeerComparisonCard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Ingested Data Sources</h2>
            <p className="text-sm text-muted-foreground">
              Federal regulatory data feeds powering this dashboard
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      </div>
    </div>
  );
}
