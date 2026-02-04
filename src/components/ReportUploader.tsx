import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  Link2, 
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  File,
  Sparkles
} from 'lucide-react';
import { ReportsTable } from './ReportsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { dataIngestionApi, IngestedReport, ApiConnection } from '@/lib/api/dataIngestion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const REPORT_TYPES = [
  { value: 'call_report', label: 'Call Report (FFIEC 031/041)' },
  { value: 'ubpr', label: 'UBPR - Uniform Bank Performance Report' },
  { value: 'fr_y9c', label: 'FRY-9C Consolidated Report' },
  { value: 'summary_of_deposits', label: 'Summary of Deposits' },
  { value: 'sec_filing', label: 'SEC Filing (10-K, 10-Q)' },
  { value: 'custom', label: 'Custom Report' },
];

const PORTALS = [
  { value: 'ffiec', label: 'FFIEC Central Data Repository', baseUrl: 'https://cdr.ffiec.gov/public' },
  { value: 'fred', label: 'FRED - Federal Reserve Economic Data', baseUrl: 'https://api.stlouisfed.org/fred' },
  { value: 'sec', label: 'SEC EDGAR', baseUrl: 'https://www.sec.gov/cgi-bin' },
  { value: 'fdic', label: 'FDIC BankFind Suite', baseUrl: 'https://banks.data.fdic.gov/api' },
  { value: 'custom', label: 'Custom API Endpoint', baseUrl: '' },
];

const AUTH_TYPES = [
  { value: 'none', label: 'No Authentication' },
  { value: 'api_key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'bearer', label: 'Bearer Token' },
];

export function ReportUploader() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadMode, setUploadMode] = useState<'upload' | 'api'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    reportType: 'call_report',
    institutionName: '',
    rssdId: '',
    reportingPeriod: '',
  });
  
  const [apiConfig, setApiConfig] = useState({
    name: '',
    portal: 'ffiec',
    baseUrl: '',
    authType: 'none',
    apiKey: '',
    rssdId: '',
    schedule: '',
  });

  // Fetch reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['ingested-reports'],
    queryFn: () => dataIngestionApi.getReports(),
  });

  // Fetch API connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ['api-connections'],
    queryFn: () => dataIngestionApi.getApiConnections(),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');
      return dataIngestionApi.uploadReport(selectedFile, uploadMetadata);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Report uploaded', description: 'Starting AI analysis...' });
        queryClient.invalidateQueries({ queryKey: ['ingested-reports'] });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Trigger analysis
        if (result.report) {
          analyzeReport(result.report);
        }
      } else {
        toast({ title: 'Upload failed', description: result.error, variant: 'destructive' });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    },
  });

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async () => {
      const portal = PORTALS.find(p => p.value === apiConfig.portal);
      return dataIngestionApi.createApiConnection({
        name: apiConfig.name || `${portal?.label} Connection`,
        portal: apiConfig.portal,
        base_url: apiConfig.portal === 'custom' ? apiConfig.baseUrl : portal?.baseUrl || '',
        auth_type: apiConfig.authType,
        rssd_id: apiConfig.rssdId,
        schedule: apiConfig.schedule || null,
        status: 'active',
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Connection created', description: 'API connection configured successfully' });
        queryClient.invalidateQueries({ queryKey: ['api-connections'] });
        setApiConfig({
          name: '',
          portal: 'ffiec',
          baseUrl: '',
          authType: 'none',
          apiKey: '',
          rssdId: '',
          schedule: '',
        });
      } else {
        toast({ title: 'Failed to create connection', description: result.error, variant: 'destructive' });
      }
    },
  });

  // Delete connection mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: (id: string) => dataIngestionApi.deleteApiConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-connections'] });
      toast({ title: 'Connection deleted' });
    },
  });

  // Analyze report function
  const analyzeReport = useCallback(async (report: IngestedReport) => {
    try {
      // For demo, we'll use a placeholder content - in production, you'd extract from the file
      const content = report.raw_content || `Financial report: ${report.name}`;
      
      const result = await dataIngestionApi.analyzeReport(
        report.id,
        content,
        report.report_type,
        report.institution_name,
        report.reporting_period
      );

      if (result.success && result.insights.length > 0) {
        await dataIngestionApi.saveInsights(report.id, result.insights);
        queryClient.invalidateQueries({ queryKey: ['ingested-reports'] });
        queryClient.invalidateQueries({ queryKey: ['report-insights'] });
        toast({ title: 'Analysis complete', description: `Generated ${result.insights.length} insights` });
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  }, [queryClient, toast]);

  // Sync API connection
  const syncConnection = async (connection: ApiConnection) => {
    toast({ title: 'Syncing...', description: `Fetching data from ${connection.name}` });
    
    const result = await dataIngestionApi.fetchFromApi(connection.portal, {
      baseUrl: connection.base_url,
      rssdId: connection.rssd_id,
    });

    if (result.success) {
      // Create a report from the fetched data
      const { data: report } = await (await import('@/integrations/supabase/client')).supabase
        .from('ingested_reports')
        .insert({
          name: `${connection.name} - ${new Date().toLocaleDateString()}`,
          report_type: connection.portal === 'ffiec' ? 'call_report' : 'custom',
          source: connection.portal,
          source_url: connection.base_url,
          rssd_id: connection.rssd_id,
          raw_content: result.markdown || JSON.stringify(result.data),
          status: 'pending'
        })
        .select()
        .single();

      if (report) {
        queryClient.invalidateQueries({ queryKey: ['ingested-reports'] });
        toast({ title: 'Data fetched', description: 'Starting AI analysis...' });
        analyzeReport(report as IngestedReport);
      }
    } else {
      toast({ title: 'Sync failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return <FileText className="w-4 h-4" />;
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return <FileSpreadsheet className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <Badge variant="success" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Analyzed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="text-xs"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'upload' | 'api')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Report
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            API Connection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Regulatory Report</CardTitle>
              <CardDescription>
                Upload PDF, Excel, Word, or CSV files for AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    {getFileIcon(selectedFile.name)}
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Excel, Word, CSV up to 20MB
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select
                    value={uploadMetadata.reportType}
                    onValueChange={(v) => setUploadMetadata(prev => ({ ...prev, reportType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Institution Name</Label>
                  <Input
                    placeholder="e.g., Mizuho Americas"
                    value={uploadMetadata.institutionName}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, institutionName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RSSD ID (Optional)</Label>
                  <Input
                    placeholder="e.g., 623806"
                    value={uploadMetadata.rssdId}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, rssdId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reporting Period</Label>
                  <Input
                    placeholder="e.g., Q4 2023"
                    value={uploadMetadata.reportingPeriod}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, reportingPeriod: e.target.value }))}
                  />
                </div>
              </div>

              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Upload & Analyze with AI</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configure API Connection</CardTitle>
              <CardDescription>
                Connect to Federal regulatory portals or custom API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Connection Name</Label>
                  <Input
                    placeholder="e.g., FFIEC Call Reports"
                    value={apiConfig.name}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Portal / Data Source</Label>
                  <Select
                    value={apiConfig.portal}
                    onValueChange={(v) => setApiConfig(prev => ({ ...prev, portal: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PORTALS.map(portal => (
                        <SelectItem key={portal.value} value={portal.value}>{portal.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {apiConfig.portal === 'custom' && (
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    placeholder="https://api.example.com"
                    value={apiConfig.baseUrl}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Authentication Type</Label>
                  <Select
                    value={apiConfig.authType}
                    onValueChange={(v) => setApiConfig(prev => ({ ...prev, authType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTH_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {apiConfig.authType !== 'none' && (
                  <div className="space-y-2">
                    <Label>API Key / Token</Label>
                    <Input
                      type="password"
                      placeholder="Enter your API key"
                      value={apiConfig.apiKey}
                      onChange={(e) => setApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RSSD ID (for FFIEC/FDIC)</Label>
                  <Input
                    placeholder="e.g., 623806"
                    value={apiConfig.rssdId}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, rssdId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sync Schedule (Optional)</Label>
                  <Select
                    value={apiConfig.schedule}
                    onValueChange={(v) => setApiConfig(prev => ({ ...prev, schedule: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Manual" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => createConnectionMutation.mutate()}
                disabled={createConnectionMutation.isPending}
                className="w-full"
              >
                {createConnectionMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" />Add Connection</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Active Connections */}
          {connections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Connections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {connections.map(connection => (
                  <div key={connection.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Link2 className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{connection.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {PORTALS.find(p => p.value === connection.portal)?.label}
                          {connection.rssd_id && ` • RSSD: ${connection.rssd_id}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncConnection(connection)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Sync
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteConnectionMutation.mutate(connection.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reports Table */}
      <ReportsTable 
        reports={reports} 
        isLoading={reportsLoading} 
        onAnalyze={analyzeReport} 
      />
    </div>
  );
}
