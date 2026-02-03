import { useState } from 'react';
import { Check, Plus, X, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { allAvailablePeers, Bank } from '@/data/dataSources';

interface PeerSelectorProps {
  selectedPeerIds: string[];
  onPeersChange: (peerIds: string[]) => void;
}

export function PeerSelector({ selectedPeerIds, onPeersChange }: PeerSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);

  const selectedPeers = allAvailablePeers.filter(bank => selectedPeerIds.includes(bank.id));
  const availablePeers = allAvailablePeers.filter(bank => !selectedPeerIds.includes(bank.id));

  const handleAddPeer = (peerId: string) => {
    if (peerId && !selectedPeerIds.includes(peerId)) {
      onPeersChange([...selectedPeerIds, peerId]);
    }
    setIsAdding(false);
  };

  const handleRemovePeer = (peerId: string) => {
    if (selectedPeerIds.length > 1) {
      onPeersChange(selectedPeerIds.filter(id => id !== peerId));
    }
  };

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Peer Group ({selectedPeers.length} banks)
        </h3>
        {availablePeers.length > 0 && !isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-8 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Peer
          </Button>
        )}
      </div>

      {/* Selected Peers */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedPeers.map((bank) => (
          <div
            key={bank.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border group"
          >
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-sm text-muted-foreground">{bank.shortName}</span>
            <span className="text-xs text-muted-foreground/70">{bank.totalAssets}</span>
            {selectedPeers.length > 1 && (
              <button
                onClick={() => handleRemovePeer(bank.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Peer Dropdown */}
      {isAdding && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Select onValueChange={handleAddPeer}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a bank to add..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {availablePeers.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{bank.shortName}</span>
                    <span className="text-xs text-muted-foreground">({bank.totalAssets})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(false)}
            className="h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Quick Info */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Comparing Mizuho Americas against {selectedPeers.length} peer institution{selectedPeers.length !== 1 ? 's' : ''}.
          {availablePeers.length > 0 && ` ${availablePeers.length} more available.`}
        </p>
      </div>
    </div>
  );
}