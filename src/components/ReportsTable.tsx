import { useState } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  FileSpreadsheet, 
  File, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Loader2,
  Sparkles,
  ExternalLink,
  Database,
  Upload,
  Download,
  Globe,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IngestedReport } from '@/lib/api/dataIngestion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const REPORT_TYPES: Record<string, string> = {
  call_report: 'Call Report (FFIEC)',
  ubpr: 'UBPR',
  fr_y9c: 'FRY-9C',
  summary_of_deposits: 'Summary of Deposits',
  sec_filing: 'SEC Filing',
  custom: 'Custom Report',
  economic_indicator: 'Economic Indicator',
};

const SOURCE_LABELS: Record<string, { label: string; icon: typeof Database }> = {
  upload: { label: 'Manual Upload', icon: Upload },
  ffiec: { label: 'FFIEC CDR', icon: Database },
  fred: { label: 'FRED', icon: Database },
  sec: { label: 'SEC EDGAR', icon: Database },
  fdic: { label: 'FDIC', icon: Database },
  custom: { label: 'Custom API', icon: ExternalLink },
};

// Available API data sources (only those with successful ingestion history)
const AVAILABLE_DATA_SOURCES = [
  {
    id: 'ffiec-call-report',
    name: 'Call Report (FFIEC 031/041)',
    report_type: 'call_report',
    source: 'ffiec',
    description: 'Quarterly Reports of Condition and Income',
    metrics: ['Tier 1 Capital', 'CET1', 'NIM', 'NPL Ratio', 'Efficiency Ratio'],
    endpoint: '/ManageFacsimiles.aspx',
  },
  {
    id: 'ffiec-ubpr',
    name: 'Uniform Bank Performance Report',
    report_type: 'ubpr',
    source: 'ffiec',
    description: 'Comparative analysis with peer groups',
    metrics: ['ROA', 'ROE', 'Cost of Funds', 'Loan-to-Deposit Ratio'],
    endpoint: '/ManageFacsimiles.aspx',
  },
  {
    id: 'ffiec-fry9c',
    name: 'FRY-9C Consolidated Report',
    report_type: 'fr_y9c',
    source: 'ffiec',
    description: 'Bank holding company financial statements',
    metrics: ['ACL Coverage', 'Capital Adequacy', 'Asset Quality'],
    endpoint: '/ManageFacsimiles.aspx',
  },
  {
    id: 'fdic-sod',
    name: 'Summary of Deposits',
    report_type: 'summary_of_deposits',
    source: 'fdic',
    description: 'Annual branch-level deposit data',
    metrics: ['Total Deposits', 'Market Share', 'Branch Count'],
    endpoint: '/sod',
  },
  {
    id: 'fdic-financials',
    name: 'FDIC Institution Financials',
    report_type: 'custom',
    source: 'fdic',
    description: 'Quarterly financial data from FDIC BankFind',
    metrics: ['Total Assets', 'Net Income', 'Equity Capital'],
    endpoint: '/financials',
  },
];

interface ReportsTableProps {
  reports: IngestedReport[];
  isLoading: boolean;
  onAnalyze: (report: IngestedReport) => void;
  rssdId?: string;
}

// Deduplicate reports: keep only the latest version for each unique report
function deduplicateReports(reports: IngestedReport[]): (IngestedReport & { hasOlderVersion?: boolean; previousDate?: string })[] {
  const reportMap = new Map<string, IngestedReport[]>();
  
  // Group reports by unique key (name + source + report_type + reporting_period)
  reports.forEach(report => {
    const key = `${report.name}-${report.source}-${report.report_type}-${report.reporting_period || ''}`;
    const existing = reportMap.get(key) || [];
    existing.push(report);
    reportMap.set(key, existing);
  });
  
  // For each group, keep only the latest version
  const deduplicated: (IngestedReport & { hasOlderVersion?: boolean; previousDate?: string })[] = [];
  
  reportMap.forEach((versions) => {
    // Sort by created_at descending (newest first)
    versions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = versions[0];
    deduplicated.push({
      ...latest,
      hasOlderVersion: versions.length > 1,
      previousDate: versions.length > 1 ? versions[1].created_at : undefined
    });
  });
  
  // Sort by created_at descending
  return deduplicated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function ReportsTable({ reports, isLoading, onAnalyze, rssdId = '623806' }: ReportsTableProps) {
  const { toast } = useToast();
  const [fetchingIds, setFetchingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'ingested' | 'available'>('ingested');
  
  // Deduplicate reports to show only the latest version
  const deduplicatedReports = deduplicateReports(reports);
  const [fetchingAll, setFetchingAll] = useState(false);

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return <FileText className="w-4 h-4 text-destructive" />;
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return <FileSpreadsheet className="w-4 h-4 text-primary" />;
    if (fileName.endsWith('.csv')) return <FileSpreadsheet className="w-4 h-4 text-accent-foreground" />;
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analyzed':
        return (
          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Analyzed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    const sourceInfo = SOURCE_LABELS[source] || SOURCE_LABELS.custom;
    const Icon = sourceInfo.icon;
    const isRealTime = source !== 'upload';
    
    return (
      <div className="flex items-center gap-1.5">
        <Badge 
          variant="outline" 
          className={isRealTime 
            ? 'bg-primary/10 text-primary border-primary/20' 
            : 'bg-muted text-muted-foreground'
          }
        >
          <Icon className="w-3 h-3 mr-1" />
          {sourceInfo.label}
        </Badge>
        {isRealTime && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Live
          </Badge>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  // Check if a data source has been ingested
  const isSourceIngested = (sourceId: string) => {
    const source = AVAILABLE_DATA_SOURCES.find(s => s.id === sourceId);
    if (!source) return false;
    return reports.some(r => 
      r.source === source.source && 
      r.report_type === source.report_type
    );
  };

  // Fetch data from an API source
  const fetchFromSource = async (source: typeof AVAILABLE_DATA_SOURCES[0], skipRefresh = false): Promise<string | null> => {
    setFetchingIds(prev => new Set(prev).add(source.id));
    
    try {
      if (!skipRefresh) {
        toast({ title: 'Fetching data...', description: `Pulling from ${SOURCE_LABELS[source.source].label}` });
      }
      
      // Use sourceId for proper routing
      const { data, error } = await supabase.functions.invoke('fetch-api-data', {
        body: {
          portal: source.source,
          sourceId: source.id, // Pass the specific source ID
          endpoint: source.endpoint,
        }
      });

      if (error) throw error;

      // Check if data was actually available
      const dataAvailable = data?.dataAvailable !== false;
      const hasValidContent = data?.markdown && data.markdown.length > 100;
      
      // Determine status based on data availability
      const reportStatus = dataAvailable && hasValidContent ? 'pending' : 'error';
      const errorMessage = !dataAvailable ? (data?.error || 'No data available for this source') : null;

      // Create a report record from the fetched data
      const { data: report, error: insertError } = await supabase
        .from('ingested_reports')
        .insert({
          name: `${source.name} - ${new Date().toLocaleDateString()}`,
          report_type: source.report_type,
          source: source.source,
          source_url: data?.metadata?.url || `${SOURCE_LABELS[source.source].label}${source.endpoint}`,
          rssd_id: source.source !== 'fred' ? rssdId : null,
          institution_name: data?.institution?.institutionName || 'Mizuho Bank (USA)',
          reporting_period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          raw_content: data?.markdown || JSON.stringify(data?.data) || '',
          status: reportStatus,
          error_message: errorMessage
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (!skipRefresh) {
        if (dataAvailable && hasValidContent) {
          toast({ 
            title: 'Data fetched successfully', 
            description: `${source.name} is ready for analysis` 
          });
        } else {
          toast({ 
            title: 'Fetch completed with issues', 
            description: errorMessage || 'Limited or no data available',
            variant: 'destructive'
          });
        }
        window.location.reload();
      }
      
      return report.id;
    } catch (error) {
      console.error('Fetch error:', error);
      if (!skipRefresh) {
        toast({ 
          title: 'Fetch failed', 
          description: error instanceof Error ? error.message : 'Failed to fetch data',
          variant: 'destructive'
        });
      }
      return null;
    } finally {
      setFetchingIds(prev => {
        const next = new Set(prev);
        next.delete(source.id);
        return next;
      });
    }
  };

  // Fetch all 9 API sources sequentially and analyze them
  const fetchAllSources = async () => {
    setFetchingAll(true);
    const results: { source: string; success: boolean; reportId?: string }[] = [];
    
    toast({ 
      title: 'Fetching all data sources...', 
      description: 'This may take a minute' 
    });

    for (const source of AVAILABLE_DATA_SOURCES) {
      setFetchingIds(prev => new Set(prev).add(source.id));
      const reportId = await fetchFromSource(source, true);
      results.push({ 
        source: source.name, 
        success: !!reportId, 
        reportId: reportId || undefined 
      });
      setFetchingIds(prev => {
        const next = new Set(prev);
        next.delete(source.id);
        return next;
      });
    }

    const successCount = results.filter(r => r.success).length;
    toast({ 
      title: `Fetched ${successCount}/${AVAILABLE_DATA_SOURCES.length} sources`, 
      description: 'Reports are ready for analysis' 
    });
    
    setFetchingAll(false);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const nonErrorReports = deduplicatedReports.filter(r => r.status !== 'error');
  const analyzedCount = nonErrorReports.filter(r => r.status === 'analyzed').length;
  const realTimeCount = deduplicatedReports.filter(r => r.source !== 'upload').length;
  const availableNotIngested = AVAILABLE_DATA_SOURCES.filter(s => !isSourceIngested(s.id)).length;
  const duplicatesRemoved = reports.length - deduplicatedReports.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">All Reports</CardTitle>
            <CardDescription className="mt-1">
              {deduplicatedReports.length} unique reports • {analyzedCount} analyzed{availableNotIngested > 0 ? ` • ${availableNotIngested} API sources not yet fetched` : ''}
              {duplicatesRemoved > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({duplicatesRemoved} older versions hidden)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={fetchAllSources}
              disabled={fetchingAll || fetchingIds.size > 0}
            >
              {fetchingAll ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Fetching All...</>
              ) : (
                <><Download className="w-3 h-3 mr-1" />Fetch All Sources</>
              )}
            </Button>
            <Badge variant="outline" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              {realTimeCount} Live
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              {AVAILABLE_DATA_SOURCES.length} Sources
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ingested' | 'available')}>
          <TabsList className="mb-4">
            <TabsTrigger value="ingested" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Ingested Reports ({nonErrorReports.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Available API Sources ({AVAILABLE_DATA_SOURCES.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingested">
            {nonErrorReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No reports ingested yet</p>
                <p className="text-sm mt-1">Upload a report or fetch from available API sources</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[280px]">Report Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonErrorReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFileIcon(report.name)}
                            <span className="font-medium truncate max-w-[200px]" title={report.name}>
                              {report.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {REPORT_TYPES[report.report_type] || report.report_type}
                          </span>
                        </TableCell>
                        <TableCell>{getSourceBadge(report.source)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {report.institution_name || '—'}
                            {report.rssd_id && (
                              <span className="block text-xs text-muted-foreground">
                                RSSD: {report.rssd_id}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{report.reporting_period || '—'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(report.created_at)}
                            {report.hasOlderVersion && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                                  <RefreshCw className="w-2.5 h-2.5 mr-0.5" />
                                  Updated
                                </Badge>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell className="text-right">
                          {report.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAnalyze(report)}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Analyze
                            </Button>
                          )}
                          {report.status === 'analyzed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAnalyze(report)}
                              title="Re-analyze with updated AI"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Re-analyze
                            </Button>
                          )}
                          {report.status === 'error' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAnalyze(report)}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>


          <TabsContent value="available">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Data Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Portal</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Key Metrics</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AVAILABLE_DATA_SOURCES.map((source) => {
                    const ingested = isSourceIngested(source.id);
                    const fetching = fetchingIds.has(source.id);
                    
                    return (
                      <TableRow key={source.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-primary" />
                            <span className="font-medium">{source.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {REPORT_TYPES[source.report_type] || source.report_type}
                          </span>
                        </TableCell>
                        <TableCell>{getSourceBadge(source.source)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {source.description}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {source.metrics.slice(0, 3).map((metric, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">
                                {metric}
                              </Badge>
                            ))}
                            {source.metrics.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{source.metrics.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ingested ? (
                            <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Ingested
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              Available
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={ingested ? "ghost" : "outline"}
                            size="sm"
                            onClick={() => fetchFromSource(source)}
                            disabled={fetching}
                          >
                            {fetching ? (
                              <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Fetching...</>
                            ) : ingested ? (
                              <><RefreshCw className="w-3 h-3 mr-1" />Refresh</>
                            ) : (
                              <><Download className="w-3 h-3 mr-1" />Fetch</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
