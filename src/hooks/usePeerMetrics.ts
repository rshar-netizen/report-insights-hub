import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PeerMetricData {
  rssdId: string;
  name: string;
  period?: string;
  metrics: {
    roa?: number;
    roe?: number;
    nim?: number;
    efficiency?: number;
    npl?: number;
    tier1?: number;
    cet1?: number;
    lcr?: number;
    totalAssets?: number;
  };
  source: string;
  fetchedAt: string;
  error?: string;
}

interface FetchPeerMetricsResponse {
  success: boolean;
  results: PeerMetricData[];
  fetchedAt: string;
  successCount: number;
  totalRequested: number;
  error?: string;
}

export function usePeerMetrics() {
  const { toast } = useToast();
  const [peerData, setPeerData] = useState<PeerMetricData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchPeerMetrics = useCallback(async (
    peers: { rssdId: string; name: string; certNumber?: string }[]
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-peer-metrics', {
        body: { peers },
      });

      if (error) {
        toast({
          title: 'Failed to fetch peer data',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      const response = data as FetchPeerMetricsResponse;

      if (response.success && response.results) {
        setPeerData(response.results);
        setLastFetched(response.fetchedAt);
        toast({
          title: 'Peer data fetched',
          description: `Retrieved real metrics for ${response.successCount}/${response.totalRequested} peers from FDIC`,
        });
      } else {
        toast({
          title: 'Fetch failed',
          description: response.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error fetching peer metrics',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Helper: get metrics for a specific peer by ID (rssdId)
  const getMetricsForPeer = useCallback((rssdId: string): PeerMetricData | undefined => {
    return peerData.find(p => p.rssdId === rssdId);
  }, [peerData]);

  return {
    peerData,
    isLoading,
    lastFetched,
    fetchPeerMetrics,
    getMetricsForPeer,
    hasFetchedData: peerData.length > 0,
  };
}
