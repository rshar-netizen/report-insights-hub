import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MapPin,
  Building2,
  DollarSign,
  Percent
} from 'lucide-react';
import { regionalPerformance, RegionalPerformance } from '@/data/dataSources';

interface RegionalPerformanceMapProps {
  selectedPeers: string[];
}

export function RegionalPerformanceMap({ selectedPeers }: RegionalPerformanceMapProps) {
  const getPerformanceIcon = (performance: RegionalPerformance['performanceVsPeers']) => {
    switch (performance) {
      case 'above':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'below':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-warning" />;
    }
  };

  const getPerformanceColor = (performance: RegionalPerformance['performanceVsPeers']) => {
    switch (performance) {
      case 'above':
        return 'border-success/30 bg-success/5';
      case 'below':
        return 'border-destructive/30 bg-destructive/5';
      default:
        return 'border-warning/30 bg-warning/5';
    }
  };

  const getPerformanceLabel = (performance: RegionalPerformance['performanceVsPeers']) => {
    switch (performance) {
      case 'above':
        return 'Outperforming';
      case 'below':
        return 'Underperforming';
      default:
        return 'At Par';
    }
  };

  // US Region positions for the simplified map
  const regionPositions: Record<string, { top: string; left: string }> = {
    NE: { top: '20%', left: '78%' },
    SE: { top: '55%', left: '72%' },
    MW: { top: '30%', left: '52%' },
    SW: { top: '55%', left: '38%' },
    W: { top: '35%', left: '15%' }
  };

  return (
    <div className="space-y-6">
      {/* Map Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Regional Performance</h3>
          <p className="text-sm text-muted-foreground">
            Mizuho Americas market presence vs {selectedPeers.length} selected peers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">Outperforming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">At Par</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Underperforming</span>
          </div>
        </div>
      </div>

      {/* Simplified US Map */}
      <div className="glass-card rounded-lg p-6">
        <div className="relative w-full h-[300px] bg-secondary/30 rounded-lg overflow-hidden border border-border">
          {/* US Map Background - Simplified SVG representation */}
          <svg
            viewBox="0 0 100 60"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Simplified US outline */}
            <path
              d="M10,25 C15,22 25,18 35,16 C45,14 55,13 65,14 C75,15 82,18 88,22 C92,26 94,32 93,38 C92,44 88,50 82,54 C75,58 65,59 55,59 C45,59 35,57 27,53 C20,49 14,44 11,38 C8,32 8,28 10,25 Z"
              className="fill-muted/30 stroke-muted-foreground/40"
              strokeWidth="0.5"
            />
            {/* Region dividers */}
            <line x1="55" y1="14" x2="55" y2="59" className="stroke-muted-foreground/30" strokeWidth="0.3" strokeDasharray="2,1" />
            <line x1="35" y1="16" x2="35" y2="57" className="stroke-muted-foreground/30" strokeWidth="0.3" strokeDasharray="2,1" />
            <line x1="35" y1="38" x2="93" y2="38" className="stroke-muted-foreground/30" strokeWidth="0.3" strokeDasharray="2,1" />
          </svg>

          {/* Region Markers */}
          {regionalPerformance.map((region) => {
            const pos = regionPositions[region.regionCode];
            const isOutperforming = region.performanceVsPeers === 'above';
            const isUnderperforming = region.performanceVsPeers === 'below';
            
            return (
              <div
                key={region.regionCode}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ top: pos.top, left: pos.left }}
              >
                {/* Marker */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 ${
                    isOutperforming
                      ? 'bg-success/20 border-2 border-success'
                      : isUnderperforming
                      ? 'bg-destructive/20 border-2 border-destructive'
                      : 'bg-warning/20 border-2 border-warning'
                  }`}
                >
                  <span className="text-xs font-bold text-foreground">{region.regionCode}</span>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="glass-card rounded-lg p-3 min-w-[200px] shadow-lg">
                    <p className="font-semibold text-foreground text-sm">{region.region}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Market Share</span>
                        <span className="text-foreground">{region.mizuhoMarketShare}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Peer Avg</span>
                        <span className="text-muted-foreground">{region.peerAvgMarketShare}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">YoY Growth</span>
                        <span className={region.yoyGrowth > 0 ? 'text-success' : 'text-destructive'}>
                          {region.yoyGrowth > 0 ? '+' : ''}{region.yoyGrowth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regional Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {regionalPerformance.map((region) => (
          <div
            key={region.regionCode}
            className={`glass-card rounded-lg p-4 border ${getPerformanceColor(region.performanceVsPeers)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">{region.region}</span>
              </div>
              {getPerformanceIcon(region.performanceVsPeers)}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Market Share</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{region.mizuhoMarketShare}%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Loans</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{region.mizuhoLoanVolume}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Branches</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{region.branchCount}</span>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">YoY Growth</span>
                  <span className={`text-sm font-semibold ${region.yoyGrowth > 0 ? 'text-success' : 'text-destructive'}`}>
                    {region.yoyGrowth > 0 ? '+' : ''}{region.yoyGrowth}%
                  </span>
                </div>
                <div className="mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    region.performanceVsPeers === 'above'
                      ? 'bg-success/10 text-success'
                      : region.performanceVsPeers === 'below'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {getPerformanceLabel(region.performanceVsPeers)} vs Peers
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Source Attribution */}
      <div className="text-xs text-muted-foreground text-center">
        Source: FFIEC CDR Branch Data, NIC Structure Data • Regional classifications based on Federal Reserve districts
      </div>
    </div>
  );
}