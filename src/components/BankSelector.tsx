import { Building2, ChevronDown } from 'lucide-react';
import { Bank } from '@/data/dataSources';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BankSelectorProps {
  banks: Bank[];
  selectedBankId: string;
  onBankChange: (bankId: string) => void;
}

export function BankSelector({ banks, selectedBankId, onBankChange }: BankSelectorProps) {
  const selectedBank = banks.find((b) => b.id === selectedBankId);

  return (
    <div className="glass-card rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Viewing metrics for</span>
            <h3 className="font-semibold text-foreground">{selectedBank?.name}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedBankId} onValueChange={onBankChange}>
            <SelectTrigger className="w-[240px] bg-secondary/50 border-border">
              <SelectValue placeholder="Select a bank" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  <div className="flex flex-col">
                    <span>{bank.shortName}</span>
                    <span className="text-xs text-muted-foreground">
                      RSSD: {bank.rssdId} • {bank.totalAssets}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedBank && (
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/50 text-sm">
          <div>
            <span className="text-muted-foreground">RSSD ID:</span>
            <span className="ml-2 text-foreground font-mono">{selectedBank.rssdId}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Assets:</span>
            <span className="ml-2 text-foreground font-semibold">{selectedBank.totalAssets}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Headquarters:</span>
            <span className="ml-2 text-foreground">{selectedBank.headquarters}</span>
          </div>
        </div>
      )}
    </div>
  );
}
