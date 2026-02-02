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

export interface KeyMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  source: string;
  reportType: string;
}

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

export const keyMetrics: KeyMetric[] = [
  {
    id: 'tier1-capital',
    label: 'Tier 1 Capital Ratio',
    value: '14.2%',
    change: 0.3,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'FRY-9C'
  },
  {
    id: 'nim',
    label: 'Net Interest Margin',
    value: '3.45%',
    change: -0.12,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'Call Report'
  },
  {
    id: 'roa',
    label: 'Return on Assets',
    value: '1.12%',
    change: 0.08,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'UBPR'
  },
  {
    id: 'efficiency',
    label: 'Efficiency Ratio',
    value: '58.3%',
    change: -2.1,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'Call Report'
  },
  {
    id: 'npl',
    label: 'NPL Ratio',
    value: '0.82%',
    change: 0.05,
    changeLabel: 'vs Q3 2023',
    source: 'FFIEC CDR',
    reportType: 'FRY-9C'
  },
  {
    id: 'fed-funds',
    label: 'Fed Funds Rate',
    value: '5.33%',
    change: 0,
    changeLabel: 'unchanged',
    source: 'FRED',
    reportType: 'Interest Rates'
  }
];

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
