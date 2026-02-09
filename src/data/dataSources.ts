export interface DataSource {
  id: string;
  name: string;
  shortName: string;
  description: string;
  url: string;
  lastIngested: string;
  status: 'active' | 'pending' | 'error';
  recordCount: number;
  reportTypes: string[];
}

// Historical data point for trend tracking
export interface MetricDataPoint {
  period: string;
  value: number;
  reportType: string;
}

// Metric with historical data for Y-o-Y and Q-o-Q tracking
export interface MetricHistoricalData {
  id: string;
  label: string;
  description: string;
  unit: string;
  quarterlyData: MetricDataPoint[];
  yearlyData: MetricDataPoint[];
  peerMedian?: number;
  sources: {
    name: string;
    reportType: string;
    url: string;
  }[];
  lastUpdated: string;
}

export interface Bank {
  id: string;
  name: string;
  shortName: string;
  rssdId: string;
  totalAssets: string;
  headquarters: string;
}

export interface ExecutiveInsight {
  id: string;
  category: 'strength' | 'attention' | 'opportunity' | 'risk';
  title: string;
  summary: string;
  metric?: string;
  source: string;
  reportType: string;
  confidence?: number;
}

export interface BankMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  source: string;
  reportType: string;
  sourceUrl: string;
  bankId: string;
  description: string;
  threshold?: {
    min?: number;
    max?: number;
    status: 'good' | 'warning' | 'critical';
  };
}

export interface MarketMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  source: string;
  reportType: string;
  description: string;
  impact: string;
}

export interface PeerComparisonMetric {
  id: string;
  label: string;
  mizuhoValue: string;
  peerValues: {
    bankName: string;
    value: string;
  }[];
  peerMedian: string;
  peerPercentile: number;
  source: string;
  reportType: string;
  interpretation: string;
  category: 'capital' | 'profitability' | 'efficiency' | 'risk' | 'liquidity';
}

// Regional performance interface
export interface RegionalPerformance {
  region: string;
  regionCode: string;
  mizuhoMarketShare: number;
  peerAvgMarketShare: number;
  mizuhoLoanVolume: string;
  mizuhoDeposits: string;
  branchCount: number;
  yoyGrowth: number;
  performanceVsPeers: 'above' | 'at' | 'below';
}

// Mizuho Americas - the focus institution
export const mizuho: Bank = {
  id: 'mizuho',
  name: 'Mizuho Bank, Ltd. - New York Branch',
  shortName: 'Mizuho Americas',
  rssdId: '623806',
  totalAssets: '$465B',
  headquarters: 'New York, NY'
};

// All available peer banks (expanded list)
export const allAvailablePeers: Bank[] = [
  {
    id: 'jpmorgan',
    name: 'JPMorgan Chase Bank, N.A.',
    shortName: 'JPMorgan',
    rssdId: '852218',
    totalAssets: '$3.4T',
    headquarters: 'New York, NY'
  },
  {
    id: 'bofa',
    name: 'Bank of America, N.A.',
    shortName: 'Bank of America',
    rssdId: '480228',
    totalAssets: '$2.5T',
    headquarters: 'Charlotte, NC'
  },
  {
    id: 'citi',
    name: 'Citibank, N.A.',
    shortName: 'Citibank',
    rssdId: '476810',
    totalAssets: '$1.7T',
    headquarters: 'New York, NY'
  },
  {
    id: 'wells',
    name: 'Wells Fargo Bank, N.A.',
    shortName: 'Wells Fargo',
    rssdId: '451965',
    totalAssets: '$1.9T',
    headquarters: 'San Francisco, CA'
  },
  {
    id: 'goldman',
    name: 'Goldman Sachs Bank USA',
    shortName: 'Goldman Sachs',
    rssdId: '2182786',
    totalAssets: '$538B',
    headquarters: 'New York, NY'
  },
  {
    id: 'morgan_stanley',
    name: 'Morgan Stanley Bank, N.A.',
    shortName: 'Morgan Stanley',
    rssdId: '1456501',
    totalAssets: '$421B',
    headquarters: 'Salt Lake City, UT'
  },
  {
    id: 'usbank',
    name: 'U.S. Bank National Association',
    shortName: 'U.S. Bank',
    rssdId: '504713',
    totalAssets: '$591B',
    headquarters: 'Cincinnati, OH'
  },
  {
    id: 'pnc',
    name: 'PNC Bank, National Association',
    shortName: 'PNC',
    rssdId: '817824',
    totalAssets: '$557B',
    headquarters: 'Pittsburgh, PA'
  },
  {
    id: 'truist',
    name: 'Truist Bank',
    shortName: 'Truist',
    rssdId: '852320',
    totalAssets: '$535B',
    headquarters: 'Charlotte, NC'
  },
  {
    id: 'td',
    name: 'TD Bank, N.A.',
    shortName: 'TD Bank',
    rssdId: '497404',
    totalAssets: '$402B',
    headquarters: 'Wilmington, DE'
  },
  {
    id: 'hsbc',
    name: 'HSBC Bank USA, National Association',
    shortName: 'HSBC USA',
    rssdId: '413208',
    totalAssets: '$166B',
    headquarters: 'New York, NY'
  },
  {
    id: 'mufg',
    name: 'MUFG Union Bank, N.A.',
    shortName: 'MUFG',
    rssdId: '134687',
    totalAssets: '$132B',
    headquarters: 'New York, NY'
  }
];

// Default G-SIB peers for comparison
export const peerBanks: Bank[] = allAvailablePeers.slice(0, 4);

// Regional performance data
export const regionalPerformance: RegionalPerformance[] = [
  {
    region: 'Northeast',
    regionCode: 'NE',
    mizuhoMarketShare: 3.2,
    peerAvgMarketShare: 8.5,
    mizuhoLoanVolume: '$142B',
    mizuhoDeposits: '$98B',
    branchCount: 12,
    yoyGrowth: 5.8,
    performanceVsPeers: 'below'
  },
  {
    region: 'Southeast',
    regionCode: 'SE',
    mizuhoMarketShare: 1.1,
    peerAvgMarketShare: 6.2,
    mizuhoLoanVolume: '$48B',
    mizuhoDeposits: '$32B',
    branchCount: 4,
    yoyGrowth: 12.4,
    performanceVsPeers: 'above'
  },
  {
    region: 'Midwest',
    regionCode: 'MW',
    mizuhoMarketShare: 0.8,
    peerAvgMarketShare: 5.8,
    mizuhoLoanVolume: '$28B',
    mizuhoDeposits: '$18B',
    branchCount: 2,
    yoyGrowth: 3.2,
    performanceVsPeers: 'at'
  },
  {
    region: 'Southwest',
    regionCode: 'SW',
    mizuhoMarketShare: 1.4,
    peerAvgMarketShare: 4.9,
    mizuhoLoanVolume: '$52B',
    mizuhoDeposits: '$38B',
    branchCount: 3,
    yoyGrowth: 8.7,
    performanceVsPeers: 'above'
  },
  {
    region: 'West',
    regionCode: 'W',
    mizuhoMarketShare: 2.1,
    peerAvgMarketShare: 7.2,
    mizuhoLoanVolume: '$86B',
    mizuhoDeposits: '$62B',
    branchCount: 6,
    yoyGrowth: 6.1,
    performanceVsPeers: 'at'
  }
];

// Generate peer-specific regional data
export const getPeerRegionalData = (peerIds: string[]): Record<string, RegionalPerformance[]> => {
  const peerData: Record<string, RegionalPerformance[]> = {};
  
  const baseMultipliers: Record<string, number> = {
    jpmorgan: 2.8,
    bofa: 2.2,
    citi: 1.6,
    wells: 1.9,
    goldman: 0.6,
    morgan_stanley: 0.5,
    usbank: 1.1,
    pnc: 0.9,
    truist: 0.8,
    td: 0.7,
    hsbc: 0.3,
    mufg: 0.25
  };

  peerIds.forEach(peerId => {
    const mult = baseMultipliers[peerId] || 1;
    peerData[peerId] = regionalPerformance.map(r => ({
      ...r,
      mizuhoMarketShare: +(r.mizuhoMarketShare * mult).toFixed(1),
      mizuhoLoanVolume: `$${Math.round(parseInt(r.mizuhoLoanVolume.replace(/\$|B/g, '')) * mult)}B`,
      mizuhoDeposits: `$${Math.round(parseInt(r.mizuhoDeposits.replace(/\$|B/g, '')) * mult)}B`,
      branchCount: Math.round(r.branchCount * mult * 3)
    }));
  });

  return peerData;
};

// Get peer comparison metrics filtered by selected peers
export const getPeerComparisonByPeers = (selectedPeerIds: string[]): PeerComparisonMetric[] => {
  const allPeerData: Record<string, Record<string, string>> = {
    jpmorgan: { tier1: '15.1%', cet1: '13.8%', roa: '1.21%', roe: '15.2%', efficiency: '54.2%', nim: '2.81%', npl: '0.68%', lcr: '112%' },
    bofa: { tier1: '13.8%', cet1: '12.1%', roa: '0.98%', roe: '11.4%', efficiency: '62.1%', nim: '2.54%', npl: '0.91%', lcr: '118%' },
    citi: { tier1: '14.5%', cet1: '13.0%', roa: '0.72%', roe: '7.8%', efficiency: '69.8%', nim: '2.48%', npl: '1.12%', lcr: '116%' },
    wells: { tier1: '12.4%', cet1: '11.2%', roa: '1.05%', roe: '12.1%', efficiency: '67.3%', nim: '3.02%', npl: '0.79%', lcr: '125%' },
    goldman: { tier1: '16.2%', cet1: '14.8%', roa: '0.88%', roe: '10.5%', efficiency: '66.1%', nim: '1.92%', npl: '0.42%', lcr: '138%' },
    morgan_stanley: { tier1: '15.8%', cet1: '14.2%', roa: '0.95%', roe: '11.2%', efficiency: '71.2%', nim: '1.85%', npl: '0.38%', lcr: '145%' },
    usbank: { tier1: '11.2%', cet1: '9.8%', roa: '1.12%', roe: '13.8%', efficiency: '59.2%', nim: '2.92%', npl: '0.82%', lcr: '108%' },
    pnc: { tier1: '11.8%', cet1: '10.2%', roa: '1.08%', roe: '12.9%', efficiency: '60.5%', nim: '2.78%', npl: '0.76%', lcr: '112%' },
    truist: { tier1: '10.9%', cet1: '9.5%', roa: '0.92%', roe: '10.8%', efficiency: '62.8%', nim: '2.98%', npl: '0.88%', lcr: '109%' },
    td: { tier1: '12.8%', cet1: '11.5%', roa: '0.85%', roe: '9.8%', efficiency: '64.2%', nim: '2.62%', npl: '0.65%', lcr: '122%' },
    hsbc: { tier1: '14.2%', cet1: '12.8%', roa: '0.78%', roe: '8.5%', efficiency: '68.5%', nim: '2.18%', npl: '0.95%', lcr: '132%' },
    mufg: { tier1: '13.5%', cet1: '12.2%', roa: '0.82%', roe: '9.2%', efficiency: '65.8%', nim: '2.35%', npl: '0.58%', lcr: '128%' }
  };

  const metricKeys = ['tier1', 'cet1', 'roa', 'roe', 'efficiency', 'nim', 'npl', 'lcr'];
  const metricLabels: Record<string, string> = {
    tier1: 'Tier 1 Capital Ratio',
    cet1: 'CET1 Ratio',
    roa: 'Return on Assets',
    roe: 'Return on Equity',
    efficiency: 'Efficiency Ratio',
    nim: 'Net Interest Margin',
    npl: 'NPL Ratio',
    lcr: 'Liquidity Coverage Ratio'
  };
  const metricCategories: Record<string, 'capital' | 'profitability' | 'efficiency' | 'risk' | 'liquidity'> = {
    tier1: 'capital',
    cet1: 'capital',
    roa: 'profitability',
    roe: 'profitability',
    efficiency: 'efficiency',
    nim: 'profitability',
    npl: 'risk',
    lcr: 'liquidity'
  };

  const mizuhoValues: Record<string, string> = {
    tier1: '14.8%', cet1: '13.2%', roa: '0.92%', roe: '9.8%',
    efficiency: '64.2%', nim: '2.42%', npl: '0.72%', lcr: '142%'
  };

  return metricKeys.map(key => {
    const peerValues = selectedPeerIds.map(peerId => {
      const bank = allAvailablePeers.find(b => b.id === peerId);
      return {
        bankName: bank?.shortName || peerId,
        value: allPeerData[peerId]?.[key] || 'N/A'
      };
    });

    const numericValues = peerValues
      .map(p => parseFloat(p.value.replace('%', '')))
      .filter(v => !isNaN(v));
    const median = numericValues.length > 0 
      ? numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)]
      : 0;
    
    const mizuhoNum = parseFloat(mizuhoValues[key].replace('%', ''));
    const percentile = numericValues.length > 0
      ? Math.round((numericValues.filter(v => v < mizuhoNum).length / numericValues.length) * 100)
      : 50;

    return {
      id: `${key}-peer`,
      label: metricLabels[key],
      mizuhoValue: mizuhoValues[key],
      peerValues,
      peerMedian: `${median.toFixed(2)}%`,
      peerPercentile: percentile,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      interpretation: percentile >= 50 
        ? `Above median among selected peers`
        : `Below median among selected peers`,
      category: metricCategories[key]
    };
  });
};

export const dataSources: DataSource[] = [
  {
    id: 'ffiec',
    name: 'FFIEC Central Data Repository',
    shortName: 'FFIEC CDR',
    description: 'Call Reports, UBPR, and other regulatory filings',
    url: 'https://cdr.ffiec.gov/',
    lastIngested: '2024-01-28T14:30:00Z',
    status: 'active',
    recordCount: 12847,
    reportTypes: ['Call Reports', 'UBPR', 'FRY-9C', 'FRY-14']
  },
  {
    id: 'fred',
    name: 'Federal Reserve Economic Data',
    shortName: 'FRED',
    description: 'Economic indicators, interest rates, and monetary data',
    url: 'https://fred.stlouisfed.org/',
    lastIngested: '2024-01-28T12:00:00Z',
    status: 'active',
    recordCount: 45230,
    reportTypes: ['Interest Rates', 'GDP', 'Employment', 'Inflation']
  },
  {
    id: 'cfpb',
    name: 'Consumer Financial Protection Bureau',
    shortName: 'CFPB',
    description: 'Consumer complaint data and regulatory guidance',
    url: 'https://www.consumerfinance.gov/data-research/',
    lastIngested: '2024-01-27T09:15:00Z',
    status: 'active',
    recordCount: 8934,
    reportTypes: ['Consumer Complaints', 'Enforcement Actions', 'Guidance']
  },
  {
    id: 'nic',
    name: 'National Information Center',
    shortName: 'NIC',
    description: 'Bank structure, holding company, and institutional data',
    url: 'https://www.ffiec.gov/NPW',
    lastIngested: '2024-01-28T08:45:00Z',
    status: 'active',
    recordCount: 6721,
    reportTypes: ['Structure Data', 'Holding Companies', 'Branches']
  },
  {
    id: 'sec',
    name: 'SEC EDGAR',
    shortName: 'SEC',
    description: '10-K, 10-Q filings and corporate disclosures',
    url: 'https://www.sec.gov/edgar/',
    lastIngested: '2024-01-26T16:20:00Z',
    status: 'active',
    recordCount: 3245,
    reportTypes: ['10-K', '10-Q', '8-K', 'Proxy Statements']
  }
];

// Executive Insights for Mizuho
export const executiveInsights: ExecutiveInsight[] = [
  {
    id: 'insight-1',
    category: 'strength',
    title: 'Capital Position Exceeds Regulatory Requirements',
    summary: 'Tier 1 Capital Ratio at 14.8% is 680 bps above the well-capitalized threshold, providing substantial buffer for strategic initiatives and stress scenarios.',
    metric: '14.8%',
    source: 'FFIEC CDR',
    reportType: 'FRY-9C'
  },
  {
    id: 'insight-2',
    category: 'attention',
    title: 'Net Interest Margin Under Pressure',
    summary: 'NIM declined 18 bps quarter-over-quarter to 2.42% due to rising deposit costs outpacing loan repricing. Peer median stands at 2.65%.',
    metric: '2.42%',
    source: 'FFIEC CDR',
    reportType: 'Call Report'
  },
  {
    id: 'insight-3',
    category: 'opportunity',
    title: 'CRE Concentration Below Peer Average',
    summary: 'Commercial Real Estate concentration at 185% of capital vs peer median of 245%, creating capacity for selective CRE growth in quality assets.',
    metric: '185%',
    source: 'FFIEC CDR',
    reportType: 'UBPR'
  },
  {
    id: 'insight-4',
    category: 'risk',
    title: 'Office Exposure Requires Monitoring',
    summary: 'Office CRE segment represents 12% of total loans with 2.1% classified. Market conditions warrant enhanced monitoring and potential reserve builds.',
    metric: '12%',
    source: 'FFIEC CDR',
    reportType: 'FRY-14Q'
  },
  {
    id: 'insight-5',
    category: 'strength',
    title: 'Liquidity Coverage Ratio Well Above Minimum',
    summary: 'LCR at 142% significantly exceeds the 100% regulatory requirement, ensuring robust liquidity position through potential stress periods.',
    metric: '142%',
    source: 'FFIEC CDR',
    reportType: 'FR 2052a'
  },
  {
    id: 'insight-6',
    category: 'attention',
    title: 'Efficiency Ratio Above Peer Median',
    summary: 'Efficiency ratio of 64.2% is 280 bps above G-SIB peer median of 61.4%. Technology investments expected to drive improvement in H2.',
    metric: '64.2%',
    source: 'FFIEC CDR',
    reportType: 'Call Report'
  }
];

// Mizuho-specific metrics
export const mizuhoMetrics: BankMetric[] = [
  {
    id: 'tier1-capital',
    label: 'Tier 1 Capital Ratio',
    value: '14.8%',
    change: 0.3,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'FRY-9C Schedule HC-R',
    sourceUrl: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    bankId: 'mizuho',
    description: 'Core capital as % of risk-weighted assets. Measures ability to absorb losses.',
    threshold: { min: 8.0, status: 'good' }
  },
  {
    id: 'cet1',
    label: 'CET1 Ratio',
    value: '13.2%',
    change: 0.2,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'FRY-9C Schedule HC-R',
    sourceUrl: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    bankId: 'mizuho',
    description: 'Common Equity Tier 1 capital as % of risk-weighted assets.',
    threshold: { min: 7.0, status: 'good' }
  },
  {
    id: 'nim',
    label: 'Net Interest Margin',
    value: '2.42%',
    change: -0.18,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'Call Report Schedule RI',
    sourceUrl: 'https://cdr.ffiec.gov/',
    bankId: 'mizuho',
    description: 'Difference between interest income and interest paid, relative to assets.',
    threshold: { min: 2.5, status: 'warning' }
  },
  {
    id: 'roa',
    label: 'Return on Assets',
    value: '0.92%',
    change: -0.05,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'UBPR',
    sourceUrl: 'https://cdr.ffiec.gov/UBPR.aspx',
    bankId: 'mizuho',
    description: 'Net income relative to total assets. Indicator of profitability efficiency.',
    threshold: { min: 1.0, status: 'warning' }
  },
  {
    id: 'roe',
    label: 'Return on Equity',
    value: '9.8%',
    change: -0.4,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'UBPR',
    sourceUrl: 'https://cdr.ffiec.gov/UBPR.aspx',
    bankId: 'mizuho',
    description: 'Net income relative to shareholder equity.',
    threshold: { min: 10.0, status: 'warning' }
  },
  {
    id: 'efficiency',
    label: 'Efficiency Ratio',
    value: '64.2%',
    change: 1.2,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'Call Report Schedule RI',
    sourceUrl: 'https://cdr.ffiec.gov/',
    bankId: 'mizuho',
    description: 'Operating expenses as % of revenue. Lower is better.',
    threshold: { max: 60, status: 'warning' }
  },
  {
    id: 'npl',
    label: 'NPL Ratio',
    value: '0.72%',
    change: 0.08,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'FRY-9C Schedule HC-N',
    sourceUrl: 'https://cdr.ffiec.gov/',
    bankId: 'mizuho',
    description: 'Non-performing loans as % of total loans. Credit quality indicator.',
    threshold: { max: 1.5, status: 'good' }
  },
  {
    id: 'lcr',
    label: 'Liquidity Coverage Ratio',
    value: '142%',
    change: 5,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'FR 2052a',
    sourceUrl: 'https://cdr.ffiec.gov/',
    bankId: 'mizuho',
    description: 'High-quality liquid assets vs. 30-day cash outflows. Min 100% required.',
    threshold: { min: 100, status: 'good' }
  },
  {
    id: 'texas-ratio',
    label: 'Texas Ratio',
    value: '8.4%',
    change: 0.2,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'UBPR',
    sourceUrl: 'https://cdr.ffiec.gov/UBPR.aspx',
    bankId: 'mizuho',
    description: 'NPLs divided by tangible equity + loan loss reserves. Bank health indicator.',
    threshold: { max: 50, status: 'good' }
  }
];

// Peer comparison metrics - comparing Mizuho to G-SIB peers
export const peerComparisonMetrics: PeerComparisonMetric[] = [
  {
    id: 'tier1-peer',
    label: 'Tier 1 Capital Ratio',
    mizuhoValue: '14.8%',
    peerValues: [
      { bankName: 'JPMorgan', value: '15.1%' },
      { bankName: 'Bank of America', value: '13.8%' },
      { bankName: 'Citibank', value: '14.5%' },
      { bankName: 'Wells Fargo', value: '12.4%' }
    ],
    peerMedian: '14.15%',
    peerPercentile: 65,
    source: 'FFIEC CDR',
    reportType: 'UBPR Peer Group',
    interpretation: 'Above peer median, demonstrating strong capital positioning among G-SIBs.',
    category: 'capital'
  },
  {
    id: 'cet1-peer',
    label: 'CET1 Ratio',
    mizuhoValue: '13.2%',
    peerValues: [
      { bankName: 'JPMorgan', value: '13.8%' },
      { bankName: 'Bank of America', value: '12.1%' },
      { bankName: 'Citibank', value: '13.0%' },
      { bankName: 'Wells Fargo', value: '11.2%' }
    ],
    peerMedian: '12.55%',
    peerPercentile: 72,
    source: 'FFIEC CDR',
    reportType: 'UBPR Peer Group',
    interpretation: 'Strong CET1 position provides buffer for growth and stress scenarios.',
    category: 'capital'
  },
  {
    id: 'roa-peer',
    label: 'Return on Assets',
    mizuhoValue: '0.92%',
    peerValues: [
      { bankName: 'JPMorgan', value: '1.21%' },
      { bankName: 'Bank of America', value: '0.98%' },
      { bankName: 'Citibank', value: '0.72%' },
      { bankName: 'Wells Fargo', value: '1.05%' }
    ],
    peerMedian: '1.02%',
    peerPercentile: 38,
    source: 'FFIEC CDR',
    reportType: 'UBPR Peer Group',
    interpretation: 'Below median profitability; NIM compression impacting returns.',
    category: 'profitability'
  },
  {
    id: 'roe-peer',
    label: 'Return on Equity',
    mizuhoValue: '9.8%',
    peerValues: [
      { bankName: 'JPMorgan', value: '15.2%' },
      { bankName: 'Bank of America', value: '11.4%' },
      { bankName: 'Citibank', value: '7.8%' },
      { bankName: 'Wells Fargo', value: '12.1%' }
    ],
    peerMedian: '11.75%',
    peerPercentile: 32,
    source: 'FFIEC CDR',
    reportType: 'UBPR Peer Group',
    interpretation: 'ROE below peer median; efficiency improvements would boost returns.',
    category: 'profitability'
  },
  {
    id: 'efficiency-peer',
    label: 'Efficiency Ratio',
    mizuhoValue: '64.2%',
    peerValues: [
      { bankName: 'JPMorgan', value: '54.2%' },
      { bankName: 'Bank of America', value: '62.1%' },
      { bankName: 'Citibank', value: '69.8%' },
      { bankName: 'Wells Fargo', value: '67.3%' }
    ],
    peerMedian: '63.15%',
    peerPercentile: 42,
    source: 'FFIEC CDR',
    reportType: 'UBPR Peer Group',
    interpretation: 'Slightly above median; operational improvements in progress.',
    category: 'efficiency'
  },
  {
    id: 'nim-peer',
    label: 'Net Interest Margin',
    mizuhoValue: '2.42%',
    peerValues: [
      { bankName: 'JPMorgan', value: '2.81%' },
      { bankName: 'Bank of America', value: '2.54%' },
      { bankName: 'Citibank', value: '2.48%' },
      { bankName: 'Wells Fargo', value: '3.02%' }
    ],
    peerMedian: '2.67%',
    peerPercentile: 22,
    source: 'FFIEC CDR',
    reportType: 'UBPR Peer Group',
    interpretation: 'NIM below peers due to liability-sensitive balance sheet.',
    category: 'profitability'
  },
  {
    id: 'npl-peer',
    label: 'NPL Ratio',
    mizuhoValue: '0.72%',
    peerValues: [
      { bankName: 'JPMorgan', value: '0.68%' },
      { bankName: 'Bank of America', value: '0.91%' },
      { bankName: 'Citibank', value: '1.12%' },
      { bankName: 'Wells Fargo', value: '0.79%' }
    ],
    peerMedian: '0.85%',
    peerPercentile: 68,
    source: 'FFIEC CDR',
    reportType: 'UBPR Peer Group',
    interpretation: 'Better than median credit quality; disciplined underwriting evident.',
    category: 'risk'
  },
  {
    id: 'lcr-peer',
    label: 'Liquidity Coverage Ratio',
    mizuhoValue: '142%',
    peerValues: [
      { bankName: 'JPMorgan', value: '112%' },
      { bankName: 'Bank of America', value: '118%' },
      { bankName: 'Citibank', value: '116%' },
      { bankName: 'Wells Fargo', value: '125%' }
    ],
    peerMedian: '117%',
    peerPercentile: 95,
    source: 'FFIEC CDR',
    reportType: 'FR 2052a',
    interpretation: 'Exceptional liquidity position; well above regulatory minimum and peers.',
    category: 'liquidity'
  }
];

// Context-aware example questions
export const executiveSummaryQuestions = [
  "What are the key drivers behind our NIM compression this quarter?",
  "How does our capital position compare to stress test requirements?",
  "What is our exposure to office CRE and current loss provisions?",
  "Summarize the latest FRY-9C filing highlights",
  "What efficiency initiatives are impacting our cost structure?"
];

export const peerBenchmarkingQuestions = [
  "How does our efficiency ratio compare to top-performing G-SIBs?",
  "Which peers have the strongest capital positions?",
  "Compare our NIM trend to Bank of America and JPMorgan",
  "What is our percentile ranking for credit quality metrics?",
  "How do our liquidity ratios benchmark against peers?"
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: {
    name: string;
    reportType: string;
    url: string;
  }[];
}

export const sampleResponses: Record<string, { content: string; sources: { name: string; reportType: string; url: string }[] }> = {
  'nim': {
    content: `## Net Interest Margin Analysis - Mizuho Americas

Your **Net Interest Margin (NIM)** currently stands at **2.42%**, declining 18 bps from Q3 2023.

### Key Drivers of NIM Compression

| Factor | Impact | Details |
|--------|--------|---------|
| Deposit Costs | -25 bps | Cost of interest-bearing deposits rose to 3.8% |
| Loan Yields | +12 bps | Average loan yield increased to 6.1% |
| Mix Shift | -5 bps | Migration from DDA to time deposits |

### Quarterly NIM Trend
| Quarter | NIM | Change |
|---------|-----|--------|
| Q4 2023 | 2.42% | -18 bps |
| Q3 2023 | 2.60% | -8 bps |
| Q2 2023 | 2.68% | -5 bps |
| Q1 2023 | 2.73% | -3 bps |

### Outlook
- Rate cuts expected in H2 2024 should provide relief
- Asset repricing acceleration initiatives underway
- Deposit pricing optimization in progress`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'Call Report Schedule RI', url: 'https://cdr.ffiec.gov/' },
      { name: 'FRED', reportType: 'FEDFUNDS', url: 'https://fred.stlouisfed.org/series/FEDFUNDS' }
    ]
  },
  'capital': {
    content: `## Capital Position Analysis - Mizuho Americas

Your **Tier 1 Capital Ratio** of **14.8%** significantly exceeds regulatory requirements.

### Regulatory Thresholds
| Requirement | Minimum | Mizuho | Buffer |
|-------------|---------|--------|--------|
| Well Capitalized | 8.0% | 14.8% | +680 bps |
| Basel III + Buffer | 10.5% | 14.8% | +430 bps |
| Stress Capital Buffer | 11.5% | 14.8% | +330 bps |

### Capital Components (Q4 2023)
- Common Equity Tier 1: $61.4B
- Additional Tier 1: $5.2B
- Risk-Weighted Assets: $465.2B

### Stress Test Implications
✓ Adequate buffer for severely adverse scenario
✓ Capacity for strategic investments and M&A
✓ Dividend sustainability confirmed`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'FRY-9C Schedule HC-R', url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx' },
      { name: 'NIC', reportType: 'Institution Profile', url: 'https://www.ffiec.gov/NPW' }
    ]
  },
  'cre': {
    content: `## Commercial Real Estate Exposure - Mizuho Americas

### Office CRE Portfolio Summary

| Metric | Value | Peer Comparison |
|--------|-------|-----------------|
| Total Office Exposure | $55.8B | 12% of loans |
| Classified Assets | $1.17B | 2.1% of segment |
| Watch List | $2.8B | 5.0% of segment |
| ALLL Coverage | 2.8% | Above peer median |

### Risk Stratification
- **Class A Urban**: 45% of portfolio, 0.8% classified
- **Class B Suburban**: 35% of portfolio, 2.4% classified  
- **Other**: 20% of portfolio, 4.2% classified

### Actions Taken
⚠️ Enhanced quarterly reviews for office loans >$10M
⚠️ Reserve build of $45M in Q4 for office segment
✓ No new office originations pending market stabilization`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'FRY-14Q Schedule H.2', url: 'https://cdr.ffiec.gov/' },
      { name: 'FFIEC CDR', reportType: 'Call Report Schedule RC-C', url: 'https://cdr.ffiec.gov/' }
    ]
  },
  'fry9c': {
    content: `## FRY-9C Q4 2023 Filing Highlights - Mizuho Americas

### Capital Adequacy
| Metric | Value | Change | Status |
|--------|-------|--------|--------|
| Tier 1 Capital | 14.8% | +30 bps | ✓ Well Capitalized |
| CET1 | 13.2% | +20 bps | ✓ Above requirement |
| Total Capital | 16.4% | +25 bps | ✓ Strong |

### Asset Quality
| Metric | Value | Trend |
|--------|-------|-------|
| NPL Ratio | 0.72% | ↑ +8 bps |
| NCO Ratio | 0.28% | → Stable |
| ALLL/Loans | 1.52% | ↑ +12 bps |

### Key Schedule Highlights
- **HC-R**: RWA optimization reduced requirement by $2.1B
- **HC-N**: Past due 30-89 days stable at 0.45%
- **HC-C**: CRE concentration at 185% of capital

### Management Actions Required
1. Continue office CRE monitoring program
2. Address NIM compression through asset repricing
3. Maintain elevated ALLL coverage`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'FRY-9C All Schedules', url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx' },
      { name: 'FFIEC CDR', reportType: 'UBPR', url: 'https://cdr.ffiec.gov/UBPR.aspx' }
    ]
  },
  'efficiency': {
    content: `## Efficiency Ratio Analysis - Mizuho Americas

Current **Efficiency Ratio: 64.2%** (up 120 bps vs Q3)

### Peer Comparison
| Bank | Efficiency Ratio | Rank |
|------|-----------------|------|
| JPMorgan | 54.2% | 1st |
| Bank of America | 62.1% | 2nd |
| Mizuho Americas | 64.2% | 3rd |
| Wells Fargo | 67.3% | 4th |
| Citibank | 69.8% | 5th |

### Cost Structure Breakdown
| Category | % of OpEx | YoY Change |
|----------|-----------|------------|
| Compensation | 52% | +3.2% |
| Technology | 18% | +8.5% |
| Occupancy | 12% | -2.1% |
| Other | 18% | +1.8% |

### Improvement Initiatives
- Digital transformation: -150 bps expected by Q4 2024
- Branch optimization: -50 bps in progress
- Vendor consolidation: -30 bps identified`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'Call Report Schedule RI', url: 'https://cdr.ffiec.gov/' },
      { name: 'FFIEC CDR', reportType: 'UBPR Peer Group', url: 'https://cdr.ffiec.gov/UBPR.aspx' }
    ]
  },
  'peer': {
    content: `## Peer Benchmarking Summary - Mizuho vs G-SIBs

### Performance Scorecard

| Metric | Mizuho | Peer Median | Percentile | Status |
|--------|--------|-------------|------------|--------|
| Tier 1 Capital | 14.8% | 14.15% | 65th | ✓ |
| ROA | 0.92% | 1.02% | 38th | ⚠️ |
| ROE | 9.8% | 11.75% | 32nd | ⚠️ |
| Efficiency | 64.2% | 63.15% | 42nd | → |
| NIM | 2.42% | 2.67% | 22nd | ⚠️ |
| NPL Ratio | 0.72% | 0.85% | 68th | ✓ |
| LCR | 142% | 117% | 95th | ✓ |

### Strengths vs Peers
✓ Exceptional liquidity positioning
✓ Strong capital base
✓ Better credit quality

### Areas for Improvement
⚠️ NIM below peer median
⚠️ Profitability metrics lag leaders
⚠️ Efficiency ratio above target`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'UBPR Peer Group', url: 'https://cdr.ffiec.gov/UBPR.aspx' },
      { name: 'NIC', reportType: 'Peer Group Analysis', url: 'https://www.ffiec.gov/NPW' }
    ]
  },
  'default': {
    content: `I'd be happy to help you analyze that. Based on Mizuho Americas' regulatory filings and peer data, I can provide insights from multiple federal sources.

**Available Analysis Areas:**
- Capital adequacy and stress testing
- Profitability metrics (NIM, ROA, ROE)
- Credit quality and CRE exposure
- Efficiency and cost structure
- Peer benchmarking across G-SIBs
- Regulatory filing highlights (FRY-9C, Call Reports)

Could you provide more specific details about what aspect you'd like to explore?`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'Multiple Reports', url: 'https://cdr.ffiec.gov/' },
      { name: 'FRED', reportType: 'Economic Data', url: 'https://fred.stlouisfed.org/' }
    ]
  }
};

// Historical metric data for trend tracking (Q-o-Q and Y-o-Y)
export const metricHistoricalData: MetricHistoricalData[] = [
  {
    id: 'nim',
    label: 'Net Interest Margin',
    description: 'Difference between interest income generated and interest expenses relative to earning assets. Key indicator of lending profitability.',
    unit: '%',
    quarterlyData: [
      { period: 'Q1 2024', value: 2.35, reportType: 'Call Report Schedule RI' },
      { period: 'Q2 2024', value: 2.41, reportType: 'Call Report Schedule RI' },
      { period: 'Q3 2024', value: 2.50, reportType: 'Call Report Schedule RI' },
      { period: 'Q4 2024', value: 2.55, reportType: 'Call Report Schedule RI' },
      { period: 'Q1 2025', value: 2.60, reportType: 'Call Report Schedule RI' },
      { period: 'Q2 2025', value: 2.58, reportType: 'Call Report Schedule RI' },
      { period: 'Q3 2025', value: 2.63, reportType: 'Call Report Schedule RI' },
      { period: 'Q4 2025', value: 2.68, reportType: 'Call Report Schedule RI' }
    ],
    yearlyData: [
      { period: '2021', value: 2.52, reportType: 'Call Report Annual' },
      { period: '2022', value: 2.85, reportType: 'Call Report Annual' },
      { period: '2023', value: 2.62, reportType: 'Call Report Annual' },
      { period: '2024', value: 2.45, reportType: 'Call Report Annual' },
      { period: '2025', value: 2.62, reportType: 'Call Report Annual' }
    ],
    peerMedian: 2.65,
    sources: [
      { name: 'FFIEC CDR', reportType: 'Call Report Schedule RI', url: 'https://cdr.ffiec.gov/' },
      { name: 'FRED', reportType: 'NEIM Index', url: 'https://fred.stlouisfed.org/series/NEIM' }
    ],
    lastUpdated: 'January 28, 2024'
  },
  {
    id: 'tier1',
    label: 'Tier 1 Capital Ratio',
    description: 'Core capital as a percentage of risk-weighted assets. Measures the bank\'s ability to absorb losses while remaining solvent.',
    unit: '%',
    quarterlyData: [
      { period: 'Q1 2024', value: 14.9, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q2 2024', value: 15.0, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q3 2024', value: 15.1, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q4 2024', value: 15.3, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q1 2025', value: 15.4, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q2 2025', value: 15.2, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q3 2025', value: 15.5, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q4 2025', value: 15.6, reportType: 'FRY-9C Schedule HC-R' }
    ],
    yearlyData: [
      { period: '2021', value: 13.8, reportType: 'FRY-9C Annual' },
      { period: '2022', value: 14.1, reportType: 'FRY-9C Annual' },
      { period: '2023', value: 14.8, reportType: 'FRY-9C Annual' },
      { period: '2024', value: 15.3, reportType: 'FRY-9C Annual' },
      { period: '2025', value: 15.6, reportType: 'FRY-9C Annual' }
    ],
    peerMedian: 14.15,
    sources: [
      { name: 'FFIEC CDR', reportType: 'FRY-9C Schedule HC-R', url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx' },
      { name: 'NIC', reportType: 'Institution Profile', url: 'https://www.ffiec.gov/NPW' }
    ],
    lastUpdated: 'January 28, 2024'
  },
  {
    id: 'cet1',
    label: 'CET1 Ratio',
    description: 'Common Equity Tier 1 capital as a percentage of risk-weighted assets. Highest quality regulatory capital.',
    unit: '%',
    quarterlyData: [
      { period: 'Q1 2024', value: 13.3, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q2 2024', value: 13.4, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q3 2024', value: 13.5, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q4 2024', value: 13.6, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q1 2025', value: 13.7, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q2 2025', value: 13.5, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q3 2025', value: 13.8, reportType: 'FRY-9C Schedule HC-R' },
      { period: 'Q4 2025', value: 13.9, reportType: 'FRY-9C Schedule HC-R' }
    ],
    yearlyData: [
      { period: '2021', value: 12.2, reportType: 'FRY-9C Annual' },
      { period: '2022', value: 12.5, reportType: 'FRY-9C Annual' },
      { period: '2023', value: 13.2, reportType: 'FRY-9C Annual' },
      { period: '2024', value: 13.6, reportType: 'FRY-9C Annual' },
      { period: '2025', value: 13.9, reportType: 'FRY-9C Annual' }
    ],
    peerMedian: 12.55,
    sources: [
      { name: 'FFIEC CDR', reportType: 'FRY-9C Schedule HC-R', url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx' }
    ],
    lastUpdated: 'January 28, 2024'
  },
  {
    id: 'roa',
    label: 'Return on Assets',
    description: 'Net income relative to total assets. Indicates how effectively the bank uses its assets to generate profit.',
    unit: '%',
    quarterlyData: [
      { period: 'Q1 2024', value: 0.88, reportType: 'UBPR Page 1' },
      { period: 'Q2 2024', value: 0.90, reportType: 'UBPR Page 1' },
      { period: 'Q3 2024', value: 0.93, reportType: 'UBPR Page 1' },
      { period: 'Q4 2024', value: 0.95, reportType: 'UBPR Page 1' },
      { period: 'Q1 2025', value: 0.97, reportType: 'UBPR Page 1' },
      { period: 'Q2 2025', value: 0.94, reportType: 'UBPR Page 1' },
      { period: 'Q3 2025', value: 1.00, reportType: 'UBPR Page 1' },
      { period: 'Q4 2025', value: 1.02, reportType: 'UBPR Page 1' }
    ],
    yearlyData: [
      { period: '2021', value: 0.95, reportType: 'UBPR Annual' },
      { period: '2022', value: 1.08, reportType: 'UBPR Annual' },
      { period: '2023', value: 0.99, reportType: 'UBPR Annual' },
      { period: '2024', value: 0.92, reportType: 'UBPR Annual' },
      { period: '2025', value: 0.98, reportType: 'UBPR Annual' }
    ],
    peerMedian: 1.02,
    sources: [
      { name: 'FFIEC CDR', reportType: 'UBPR Page 1', url: 'https://cdr.ffiec.gov/UBPR.aspx' }
    ],
    lastUpdated: 'January 28, 2024'
  },
  {
    id: 'roe',
    label: 'Return on Equity',
    description: 'Net income relative to shareholders\' equity. Measures profitability from shareholder perspective.',
    unit: '%',
    quarterlyData: [
      { period: 'Q1 2024', value: 9.5, reportType: 'UBPR Page 1' },
      { period: 'Q2 2024', value: 9.8, reportType: 'UBPR Page 1' },
      { period: 'Q3 2024', value: 10.1, reportType: 'UBPR Page 1' },
      { period: 'Q4 2024', value: 10.4, reportType: 'UBPR Page 1' },
      { period: 'Q1 2025', value: 10.6, reportType: 'UBPR Page 1' },
      { period: 'Q2 2025', value: 10.3, reportType: 'UBPR Page 1' },
      { period: 'Q3 2025', value: 10.8, reportType: 'UBPR Page 1' },
      { period: 'Q4 2025', value: 11.0, reportType: 'UBPR Page 1' }
    ],
    yearlyData: [
      { period: '2021', value: 10.5, reportType: 'UBPR Annual' },
      { period: '2022', value: 11.8, reportType: 'UBPR Annual' },
      { period: '2023', value: 10.5, reportType: 'UBPR Annual' },
      { period: '2024', value: 9.9, reportType: 'UBPR Annual' },
      { period: '2025', value: 10.7, reportType: 'UBPR Annual' }
    ],
    peerMedian: 11.75,
    sources: [
      { name: 'FFIEC CDR', reportType: 'UBPR Page 1', url: 'https://cdr.ffiec.gov/UBPR.aspx' }
    ],
    lastUpdated: 'January 28, 2024'
  },
  {
    id: 'efficiency',
    label: 'Efficiency Ratio',
    description: 'Non-interest expenses as a percentage of revenue. Lower values indicate better operational efficiency.',
    unit: '%',
    quarterlyData: [
      { period: 'Q1 2024', value: 63.8, reportType: 'Call Report Schedule RI' },
      { period: 'Q2 2024', value: 63.2, reportType: 'Call Report Schedule RI' },
      { period: 'Q3 2024', value: 62.5, reportType: 'Call Report Schedule RI' },
      { period: 'Q4 2024', value: 61.8, reportType: 'Call Report Schedule RI' },
      { period: 'Q1 2025', value: 61.2, reportType: 'Call Report Schedule RI' },
      { period: 'Q2 2025', value: 61.5, reportType: 'Call Report Schedule RI' },
      { period: 'Q3 2025', value: 60.8, reportType: 'Call Report Schedule RI' },
      { period: 'Q4 2025', value: 60.2, reportType: 'Call Report Schedule RI' }
    ],
    yearlyData: [
      { period: '2021', value: 65.2, reportType: 'Call Report Annual' },
      { period: '2022', value: 62.8, reportType: 'Call Report Annual' },
      { period: '2023', value: 62.7, reportType: 'Call Report Annual' },
      { period: '2024', value: 62.8, reportType: 'Call Report Annual' },
      { period: '2025', value: 60.9, reportType: 'Call Report Annual' }
    ],
    peerMedian: 63.15,
    sources: [
      { name: 'FFIEC CDR', reportType: 'Call Report Schedule RI', url: 'https://cdr.ffiec.gov/' }
    ],
    lastUpdated: 'January 28, 2024'
  },
  {
    id: 'npl',
    label: 'NPL Ratio',
    description: 'Non-performing loans as a percentage of total loans. Key indicator of credit quality and asset health.',
    unit: '%',
    quarterlyData: [
      { period: 'Q1 2024', value: 0.75, reportType: 'FRY-9C Schedule HC-N' },
      { period: 'Q2 2024', value: 0.78, reportType: 'FRY-9C Schedule HC-N' },
      { period: 'Q3 2024', value: 0.80, reportType: 'FRY-9C Schedule HC-N' },
      { period: 'Q4 2024', value: 0.76, reportType: 'FRY-9C Schedule HC-N' },
      { period: 'Q1 2025', value: 0.73, reportType: 'FRY-9C Schedule HC-N' },
      { period: 'Q2 2025', value: 0.70, reportType: 'FRY-9C Schedule HC-N' },
      { period: 'Q3 2025', value: 0.68, reportType: 'FRY-9C Schedule HC-N' },
      { period: 'Q4 2025', value: 0.65, reportType: 'FRY-9C Schedule HC-N' }
    ],
    yearlyData: [
      { period: '2021', value: 0.72, reportType: 'FRY-9C Annual' },
      { period: '2022', value: 0.55, reportType: 'FRY-9C Annual' },
      { period: '2023', value: 0.64, reportType: 'FRY-9C Annual' },
      { period: '2024', value: 0.77, reportType: 'FRY-9C Annual' },
      { period: '2025', value: 0.69, reportType: 'FRY-9C Annual' }
    ],
    peerMedian: 0.85,
    sources: [
      { name: 'FFIEC CDR', reportType: 'FRY-9C Schedule HC-N', url: 'https://cdr.ffiec.gov/' }
    ],
    lastUpdated: 'January 28, 2024'
  },
  {
    id: 'lcr',
    label: 'Liquidity Coverage Ratio',
    description: 'High-quality liquid assets as a percentage of 30-day net cash outflows. Regulatory minimum is 100%.',
    unit: '%',
    quarterlyData: [
      { period: 'Q1 2024', value: 145, reportType: 'FR 2052a' },
      { period: 'Q2 2024', value: 140, reportType: 'FR 2052a' },
      { period: 'Q3 2024', value: 138, reportType: 'FR 2052a' },
      { period: 'Q4 2024', value: 143, reportType: 'FR 2052a' },
      { period: 'Q1 2025', value: 146, reportType: 'FR 2052a' },
      { period: 'Q2 2025', value: 148, reportType: 'FR 2052a' },
      { period: 'Q3 2025', value: 150, reportType: 'FR 2052a' },
      { period: 'Q4 2025', value: 152, reportType: 'FR 2052a' }
    ],
    yearlyData: [
      { period: '2021', value: 125, reportType: 'FR 2052a Annual' },
      { period: '2022', value: 130, reportType: 'FR 2052a Annual' },
      { period: '2023', value: 135, reportType: 'FR 2052a Annual' },
      { period: '2024', value: 142, reportType: 'FR 2052a Annual' },
      { period: '2025', value: 149, reportType: 'FR 2052a Annual' }
    ],
    peerMedian: 117,
    sources: [
      { name: 'FFIEC CDR', reportType: 'FR 2052a', url: 'https://cdr.ffiec.gov/' },
      { name: 'Federal Reserve', reportType: 'Liquidity Reports', url: 'https://www.federalreserve.gov/supervisionreg/srletters/sr1006.htm' }
    ],
    lastUpdated: 'January 28, 2024'
  },
  {
    id: 'texas',
    label: 'Texas Ratio',
    description: 'Non-performing assets divided by tangible equity plus loan loss reserves. Measures bank health; below 50% is considered safe.',
    unit: '%',
    quarterlyData: [
      { period: 'Q1 2024', value: 8.6, reportType: 'UBPR' },
      { period: 'Q2 2024', value: 8.3, reportType: 'UBPR' },
      { period: 'Q3 2024', value: 8.0, reportType: 'UBPR' },
      { period: 'Q4 2024', value: 7.8, reportType: 'UBPR' },
      { period: 'Q1 2025', value: 7.5, reportType: 'UBPR' },
      { period: 'Q2 2025', value: 7.3, reportType: 'UBPR' },
      { period: 'Q3 2025', value: 7.1, reportType: 'UBPR' },
      { period: 'Q4 2025', value: 6.9, reportType: 'UBPR' }
    ],
    yearlyData: [
      { period: '2021', value: 9.8, reportType: 'UBPR Annual' },
      { period: '2022', value: 7.5, reportType: 'UBPR Annual' },
      { period: '2023', value: 8.1, reportType: 'UBPR Annual' },
      { period: '2024', value: 8.2, reportType: 'UBPR Annual' },
      { period: '2025', value: 7.2, reportType: 'UBPR Annual' }
    ],
    peerMedian: 10.2,
    sources: [
      { name: 'FFIEC CDR', reportType: 'UBPR', url: 'https://cdr.ffiec.gov/UBPR.aspx' }
    ],
    lastUpdated: 'January 28, 2024'
  }
];
