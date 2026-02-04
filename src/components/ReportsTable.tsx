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
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IngestedReport } from '@/lib/api/dataIngestion';

const REPORT_TYPES: Record<string, string> = {
  call_report: 'Call Report (FFIEC)',
  ubpr: 'UBPR',
  fr_y9c: 'FRY-9C',
  summary_of_deposits: 'Summary of Deposits',
  sec_filing: 'SEC Filing',
  custom: 'Custom Report',
};

const SOURCE_LABELS: Record<string, { label: string; icon: typeof Database }> = {
  upload: { label: 'Manual Upload', icon: Upload },
  ffiec: { label: 'FFIEC CDR', icon: Database },
  fred: { label: 'FRED', icon: Database },
  sec: { label: 'SEC EDGAR', icon: Database },
  fdic: { label: 'FDIC', icon: Database },
  custom: { label: 'Custom API', icon: ExternalLink },
};

interface ReportsTableProps {
  reports: IngestedReport[];
  isLoading: boolean;
  onAnalyze: (report: IngestedReport) => void;
}

export function ReportsTable({ reports, isLoading, onAnalyze }: ReportsTableProps) {
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

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Reports</CardTitle>
          <CardDescription>
            No reports ingested yet. Upload a report or connect to an API to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No reports available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const analyzedCount = reports.filter(r => r.status === 'analyzed').length;
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const realTimeCount = reports.filter(r => r.source !== 'upload').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">All Reports</CardTitle>
            <CardDescription className="mt-1">
              {reports.length} total • {analyzedCount} analyzed • {pendingCount} pending • {realTimeCount} from live sources
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              {realTimeCount} Real-time
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Upload className="w-3 h-3 mr-1" />
              {reports.length - realTimeCount} Uploaded
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Ingested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
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
                    <span className="text-sm text-muted-foreground">
                      {formatDate(report.created_at)}
                    </span>
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
                    {report.status === 'error' && report.error_message && (
                      <span 
                        className="text-xs text-destructive cursor-help"
                        title={report.error_message}
                      >
                        View Error
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
