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

export interface Bank {
  id: string;
  name: string;
  shortName: string;
  rssdId: string;
  totalAssets: string;
  headquarters: string;
}

export interface BankMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  source: string;
  reportType: string;
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
  bankValue: string;
  peerMedian: string;
  peerPercentile: number;
  source: string;
  reportType: string;
  bankId: string;
  interpretation: string;
}

export const banks: Bank[] = [
  {
    id: 'jpmorgan',
    name: 'JPMorgan Chase Bank, N.A.',
    shortName: 'JPMorgan Chase',
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
    id: 'wells',
    name: 'Wells Fargo Bank, N.A.',
    shortName: 'Wells Fargo',
    rssdId: '451965',
    totalAssets: '$1.9T',
    headquarters: 'San Francisco, CA'
  },
  {
    id: 'citi',
    name: 'Citibank, N.A.',
    shortName: 'Citibank',
    rssdId: '476810',
    totalAssets: '$1.7T',
    headquarters: 'New York, NY'
  }
];

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

// Bank-specific metrics - these vary by institution
export const bankMetrics: Record<string, BankMetric[]> = {
  jpmorgan: [
    {
      id: 'tier1-capital',
      label: 'Tier 1 Capital Ratio',
      value: '15.1%',
      change: 0.4,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FRY-9C',
      bankId: 'jpmorgan',
      description: 'Core capital as % of risk-weighted assets. Measures ability to absorb losses.',
      threshold: { min: 8.0, status: 'good' }
    },
    {
      id: 'nim',
      label: 'Net Interest Margin',
      value: '2.81%',
      change: -0.08,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'Call Report',
      bankId: 'jpmorgan',
      description: 'Difference between interest income and interest paid, relative to assets.',
      threshold: { min: 2.5, status: 'good' }
    },
    {
      id: 'roa',
      label: 'Return on Assets',
      value: '1.21%',
      change: 0.05,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'UBPR',
      bankId: 'jpmorgan',
      description: 'Net income relative to total assets. Indicator of profitability efficiency.',
      threshold: { min: 1.0, status: 'good' }
    },
    {
      id: 'efficiency',
      label: 'Efficiency Ratio',
      value: '54.2%',
      change: -1.8,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'Call Report',
      bankId: 'jpmorgan',
      description: 'Operating expenses as % of revenue. Lower is better.',
      threshold: { max: 60, status: 'good' }
    },
    {
      id: 'npl',
      label: 'NPL Ratio',
      value: '0.68%',
      change: 0.03,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FRY-9C',
      bankId: 'jpmorgan',
      description: 'Non-performing loans as % of total loans. Credit quality indicator.',
      threshold: { max: 1.5, status: 'good' }
    },
    {
      id: 'lcr',
      label: 'Liquidity Coverage Ratio',
      value: '112%',
      change: 2,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FR 2052a',
      bankId: 'jpmorgan',
      description: 'High-quality liquid assets vs. 30-day cash outflows. Min 100% required.',
      threshold: { min: 100, status: 'good' }
    }
  ],
  bofa: [
    {
      id: 'tier1-capital',
      label: 'Tier 1 Capital Ratio',
      value: '13.8%',
      change: 0.2,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FRY-9C',
      bankId: 'bofa',
      description: 'Core capital as % of risk-weighted assets. Measures ability to absorb losses.',
      threshold: { min: 8.0, status: 'good' }
    },
    {
      id: 'nim',
      label: 'Net Interest Margin',
      value: '2.54%',
      change: -0.15,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'Call Report',
      bankId: 'bofa',
      description: 'Difference between interest income and interest paid, relative to assets.',
      threshold: { min: 2.5, status: 'warning' }
    },
    {
      id: 'roa',
      label: 'Return on Assets',
      value: '0.98%',
      change: -0.02,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'UBPR',
      bankId: 'bofa',
      description: 'Net income relative to total assets. Indicator of profitability efficiency.',
      threshold: { min: 1.0, status: 'warning' }
    },
    {
      id: 'efficiency',
      label: 'Efficiency Ratio',
      value: '62.1%',
      change: 1.2,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'Call Report',
      bankId: 'bofa',
      description: 'Operating expenses as % of revenue. Lower is better.',
      threshold: { max: 60, status: 'warning' }
    },
    {
      id: 'npl',
      label: 'NPL Ratio',
      value: '0.91%',
      change: 0.08,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FRY-9C',
      bankId: 'bofa',
      description: 'Non-performing loans as % of total loans. Credit quality indicator.',
      threshold: { max: 1.5, status: 'good' }
    },
    {
      id: 'lcr',
      label: 'Liquidity Coverage Ratio',
      value: '118%',
      change: 5,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FR 2052a',
      bankId: 'bofa',
      description: 'High-quality liquid assets vs. 30-day cash outflows. Min 100% required.',
      threshold: { min: 100, status: 'good' }
    }
  ],
  wells: [
    {
      id: 'tier1-capital',
      label: 'Tier 1 Capital Ratio',
      value: '12.4%',
      change: 0.1,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FRY-9C',
      bankId: 'wells',
      description: 'Core capital as % of risk-weighted assets. Measures ability to absorb losses.',
      threshold: { min: 8.0, status: 'good' }
    },
    {
      id: 'nim',
      label: 'Net Interest Margin',
      value: '3.02%',
      change: -0.05,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'Call Report',
      bankId: 'wells',
      description: 'Difference between interest income and interest paid, relative to assets.',
      threshold: { min: 2.5, status: 'good' }
    },
    {
      id: 'roa',
      label: 'Return on Assets',
      value: '1.05%',
      change: 0.02,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'UBPR',
      bankId: 'wells',
      description: 'Net income relative to total assets. Indicator of profitability efficiency.',
      threshold: { min: 1.0, status: 'good' }
    },
    {
      id: 'efficiency',
      label: 'Efficiency Ratio',
      value: '67.3%',
      change: -2.5,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'Call Report',
      bankId: 'wells',
      description: 'Operating expenses as % of revenue. Lower is better.',
      threshold: { max: 60, status: 'critical' }
    },
    {
      id: 'npl',
      label: 'NPL Ratio',
      value: '0.79%',
      change: -0.04,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FRY-9C',
      bankId: 'wells',
      description: 'Non-performing loans as % of total loans. Credit quality indicator.',
      threshold: { max: 1.5, status: 'good' }
    },
    {
      id: 'lcr',
      label: 'Liquidity Coverage Ratio',
      value: '125%',
      change: 3,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FR 2052a',
      bankId: 'wells',
      description: 'High-quality liquid assets vs. 30-day cash outflows. Min 100% required.',
      threshold: { min: 100, status: 'good' }
    }
  ],
  citi: [
    {
      id: 'tier1-capital',
      label: 'Tier 1 Capital Ratio',
      value: '14.5%',
      change: 0.3,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FRY-9C',
      bankId: 'citi',
      description: 'Core capital as % of risk-weighted assets. Measures ability to absorb losses.',
      threshold: { min: 8.0, status: 'good' }
    },
    {
      id: 'nim',
      label: 'Net Interest Margin',
      value: '2.48%',
      change: -0.12,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'Call Report',
      bankId: 'citi',
      description: 'Difference between interest income and interest paid, relative to assets.',
      threshold: { min: 2.5, status: 'warning' }
    },
    {
      id: 'roa',
      label: 'Return on Assets',
      value: '0.72%',
      change: -0.08,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'UBPR',
      bankId: 'citi',
      description: 'Net income relative to total assets. Indicator of profitability efficiency.',
      threshold: { min: 1.0, status: 'warning' }
    },
    {
      id: 'efficiency',
      label: 'Efficiency Ratio',
      value: '69.8%',
      change: 0.5,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'Call Report',
      bankId: 'citi',
      description: 'Operating expenses as % of revenue. Lower is better.',
      threshold: { max: 60, status: 'critical' }
    },
    {
      id: 'npl',
      label: 'NPL Ratio',
      value: '1.12%',
      change: 0.15,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FRY-9C',
      bankId: 'citi',
      description: 'Non-performing loans as % of total loans. Credit quality indicator.',
      threshold: { max: 1.5, status: 'warning' }
    },
    {
      id: 'lcr',
      label: 'Liquidity Coverage Ratio',
      value: '116%',
      change: 1,
      changeLabel: 'vs Q3 2023',
      source: 'FFIEC CDR',
      reportType: 'FR 2052a',
      bankId: 'citi',
      description: 'High-quality liquid assets vs. 30-day cash outflows. Min 100% required.',
      threshold: { min: 100, status: 'good' }
    }
  ]
};

// Market-wide metrics - same for all banks
export const marketMetrics: MarketMetric[] = [
  {
    id: 'fed-funds',
    label: 'Fed Funds Rate',
    value: '5.33%',
    change: 0,
    changeLabel: 'unchanged',
    source: 'FRED',
    reportType: 'FEDFUNDS',
    description: 'Target rate set by the Federal Reserve for overnight bank lending.',
    impact: 'Higher rates increase funding costs but may improve NIM for asset-sensitive banks.'
  },
  {
    id: '10yr-treasury',
    label: '10-Year Treasury Yield',
    value: '4.15%',
    change: -0.12,
    changeLabel: 'vs last week',
    source: 'FRED',
    reportType: 'DGS10',
    description: 'Benchmark for long-term interest rates and mortgage pricing.',
    impact: 'Declining yields may signal economic slowdown; affects MBS valuations.'
  },
  {
    id: 'sofr',
    label: 'SOFR Rate',
    value: '5.31%',
    change: 0.01,
    changeLabel: 'vs yesterday',
    source: 'FRED',
    reportType: 'SOFR',
    description: 'Secured Overnight Financing Rate - replacement for LIBOR.',
    impact: 'Primary benchmark for floating-rate loans and derivatives.'
  },
  {
    id: 'cpi',
    label: 'CPI (YoY)',
    value: '3.1%',
    change: -0.3,
    changeLabel: 'vs prior month',
    source: 'FRED',
    reportType: 'CPIAUCSL',
    description: 'Consumer Price Index measures inflation in consumer goods and services.',
    impact: 'Declining inflation may lead to rate cuts; affects real returns on assets.'
  },
  {
    id: 'unemployment',
    label: 'Unemployment Rate',
    value: '3.7%',
    change: 0.1,
    changeLabel: 'vs prior month',
    source: 'FRED',
    reportType: 'UNRATE',
    description: 'Percentage of labor force currently unemployed.',
    impact: 'Rising unemployment may signal credit quality deterioration ahead.'
  },
  {
    id: 'gdp-growth',
    label: 'GDP Growth (Q/Q)',
    value: '3.3%',
    change: 1.0,
    changeLabel: 'vs Q2 2023',
    source: 'FRED',
    reportType: 'A191RL1Q225SBEA',
    description: 'Quarterly annualized GDP growth rate.',
    impact: 'Strong growth supports loan demand and credit quality.'
  }
];

// Peer comparison metrics by bank
export const peerComparisonMetrics: Record<string, PeerComparisonMetric[]> = {
  jpmorgan: [
    {
      id: 'tier1-peer',
      label: 'Tier 1 Capital Ratio',
      bankValue: '15.1%',
      peerMedian: '13.2%',
      peerPercentile: 92,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'jpmorgan',
      interpretation: 'Significantly above peer median, indicating strong capital position.'
    },
    {
      id: 'roa-peer',
      label: 'Return on Assets',
      bankValue: '1.21%',
      peerMedian: '1.05%',
      peerPercentile: 78,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'jpmorgan',
      interpretation: 'Above average profitability compared to G-SIB peers.'
    },
    {
      id: 'efficiency-peer',
      label: 'Efficiency Ratio',
      bankValue: '54.2%',
      peerMedian: '61.5%',
      peerPercentile: 88,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'jpmorgan',
      interpretation: 'Best-in-class operational efficiency among large banks.'
    },
    {
      id: 'npl-peer',
      label: 'NPL Ratio',
      bankValue: '0.68%',
      peerMedian: '0.85%',
      peerPercentile: 72,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'jpmorgan',
      interpretation: 'Credit quality better than most peers.'
    }
  ],
  bofa: [
    {
      id: 'tier1-peer',
      label: 'Tier 1 Capital Ratio',
      bankValue: '13.8%',
      peerMedian: '13.2%',
      peerPercentile: 62,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'bofa',
      interpretation: 'Slightly above peer median capital levels.'
    },
    {
      id: 'roa-peer',
      label: 'Return on Assets',
      bankValue: '0.98%',
      peerMedian: '1.05%',
      peerPercentile: 42,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'bofa',
      interpretation: 'Below average profitability; room for improvement.'
    },
    {
      id: 'efficiency-peer',
      label: 'Efficiency Ratio',
      bankValue: '62.1%',
      peerMedian: '61.5%',
      peerPercentile: 48,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'bofa',
      interpretation: 'In line with peer median efficiency.'
    },
    {
      id: 'npl-peer',
      label: 'NPL Ratio',
      bankValue: '0.91%',
      peerMedian: '0.85%',
      peerPercentile: 38,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'bofa',
      interpretation: 'Credit quality slightly below peer average.'
    }
  ],
  wells: [
    {
      id: 'tier1-peer',
      label: 'Tier 1 Capital Ratio',
      bankValue: '12.4%',
      peerMedian: '13.2%',
      peerPercentile: 35,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'wells',
      interpretation: 'Below peer median; may face capital constraints.'
    },
    {
      id: 'roa-peer',
      label: 'Return on Assets',
      bankValue: '1.05%',
      peerMedian: '1.05%',
      peerPercentile: 50,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'wells',
      interpretation: 'Exactly at peer median profitability.'
    },
    {
      id: 'efficiency-peer',
      label: 'Efficiency Ratio',
      bankValue: '67.3%',
      peerMedian: '61.5%',
      peerPercentile: 22,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'wells',
      interpretation: 'Below peer efficiency; ongoing remediation efforts needed.'
    },
    {
      id: 'npl-peer',
      label: 'NPL Ratio',
      bankValue: '0.79%',
      peerMedian: '0.85%',
      peerPercentile: 58,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'wells',
      interpretation: 'Slightly better credit quality than peers.'
    }
  ],
  citi: [
    {
      id: 'tier1-peer',
      label: 'Tier 1 Capital Ratio',
      bankValue: '14.5%',
      peerMedian: '13.2%',
      peerPercentile: 75,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'citi',
      interpretation: 'Strong capital position relative to peers.'
    },
    {
      id: 'roa-peer',
      label: 'Return on Assets',
      bankValue: '0.72%',
      peerMedian: '1.05%',
      peerPercentile: 18,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'citi',
      interpretation: 'Significantly below peer profitability; restructuring in progress.'
    },
    {
      id: 'efficiency-peer',
      label: 'Efficiency Ratio',
      bankValue: '69.8%',
      peerMedian: '61.5%',
      peerPercentile: 12,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'citi',
      interpretation: 'Worst-in-class efficiency among G-SIBs; major focus area.'
    },
    {
      id: 'npl-peer',
      label: 'NPL Ratio',
      bankValue: '1.12%',
      peerMedian: '0.85%',
      peerPercentile: 25,
      source: 'FFIEC CDR',
      reportType: 'UBPR Peer Group',
      bankId: 'citi',
      interpretation: 'Elevated credit risk; consumer portfolio concerns.'
    }
  ]
};

export const exampleQuestions = [
  "What is our current Tier 1 Capital ratio and how does it compare to regulatory requirements?",
  "Show me the trend in Net Interest Margin over the last 4 quarters",
  "What are the key risk indicators from the latest FRY-9C filing?",
  "How do our efficiency metrics compare to peer banks?",
  "Summarize any recent CFPB enforcement actions in our sector",
  "What is the current Fed Funds rate outlook and impact on our NIM?"
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
  'tier1': {
    content: `## Tier 1 Capital Analysis

Your current **Tier 1 Capital Ratio stands at 14.2%**, which is well above the regulatory minimum requirements:

### Regulatory Thresholds
| Requirement | Minimum | Your Bank |
|-------------|---------|-----------|
| Well Capitalized | 8.0% | ✓ 14.2% |
| Adequately Capitalized | 6.0% | ✓ 14.2% |
| Basel III Buffer | 10.5% | ✓ 14.2% |

### Key Observations
- **Buffer above minimum**: 6.2 percentage points above well-capitalized threshold
- **Quarter-over-quarter change**: +30 basis points improvement
- **Peer comparison**: Above median for regional banks (13.1%)

### Capital Components (FRY-9C Schedule HC-R)
- Common Equity Tier 1: $4.2B
- Additional Tier 1: $380M
- Risk-Weighted Assets: $32.4B`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'FRY-9C Schedule HC-R', url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx' },
      { name: 'FRED', reportType: 'Bank Capital Ratios', url: 'https://fred.stlouisfed.org/series/USNIM' },
      { name: 'NIC', reportType: 'Institution Profile', url: 'https://www.ffiec.gov/NPW' }
    ]
  },
  'nim': {
    content: `## Net Interest Margin Trend Analysis

Your **Net Interest Margin (NIM)** has shown the following quarterly progression:

### Quarterly NIM Trend
| Quarter | NIM | Change |
|---------|-----|--------|
| Q4 2023 | 3.45% | -12 bps |
| Q3 2023 | 3.57% | -8 bps |
| Q2 2023 | 3.65% | +3 bps |
| Q1 2023 | 3.62% | -5 bps |

### Contributing Factors
1. **Interest Rate Environment**: Fed Funds at 5.33% creating deposit pricing pressure
2. **Loan Yield**: Average loan yield increased to 6.82% (+15 bps)
3. **Deposit Costs**: Cost of deposits rose to 2.45% (+28 bps)

### Outlook Considerations
- Rate cuts expected in H2 2024 may provide NIM relief
- Deposit mix shift from non-interest to interest-bearing continues
- Loan repricing lag affecting short-term margins`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'Call Report Schedule RI', url: 'https://cdr.ffiec.gov/' },
      { name: 'FRED', reportType: 'Net Interest Margin', url: 'https://fred.stlouisfed.org/series/USNIM' },
      { name: 'FRED', reportType: 'Federal Funds Rate', url: 'https://fred.stlouisfed.org/series/FEDFUNDS' }
    ]
  },
  'fry9c': {
    content: `## FRY-9C Key Risk Indicators

Based on your latest FRY-9C filing (Q4 2023), here are the critical risk metrics:

### Credit Risk Indicators
| Metric | Value | Trend | Peer Median |
|--------|-------|-------|-------------|
| NPL Ratio | 0.82% | ↑ +5 bps | 0.91% |
| NCO Ratio | 0.34% | → stable | 0.38% |
| ALLL/Loans | 1.42% | ↑ +8 bps | 1.35% |
| CRE Concentration | 245% | ↓ -12% | 280% |

### Liquidity Risk
- **LCR**: 128% (well above 100% requirement)
- **NSFR**: 112%
- **Cash to Assets**: 8.4%

### Interest Rate Risk
- **EVE Sensitivity (+200 bps)**: -4.2%
- **NII at Risk (+200 bps)**: -2.8%

### Areas of Focus
⚠️ Commercial Real Estate exposure elevated but declining
✓ Strong reserve coverage for potential credit losses
✓ Liquidity position exceeds regulatory thresholds`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'FRY-9C Schedules HC-C, HC-N', url: 'https://cdr.ffiec.gov/' },
      { name: 'FFIEC CDR', reportType: 'UBPR Peer Analysis', url: 'https://cdr.ffiec.gov/UBPR.aspx' },
      { name: 'NIC', reportType: 'Institution Structure', url: 'https://www.ffiec.gov/NPW' }
    ]
  },
  'default': {
    content: `I'd be happy to help you analyze that. Based on the available regulatory filings and economic data, I can provide insights from multiple federal sources.

Please note that I'm drawing from:
- **FFIEC CDR**: Call Reports, FRY-9C, UBPR data
- **FRED**: Economic indicators and interest rates
- **CFPB**: Consumer protection data
- **NIC**: Institutional structure data

Could you provide more specific details about what aspect you'd like to explore?`,
    sources: [
      { name: 'FFIEC CDR', reportType: 'Multiple Reports', url: 'https://cdr.ffiec.gov/' },
      { name: 'FRED', reportType: 'Economic Data', url: 'https://fred.stlouisfed.org/' }
    ]
  }
};
