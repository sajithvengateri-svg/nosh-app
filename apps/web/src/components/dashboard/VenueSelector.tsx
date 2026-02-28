import { useOrg } from "@/contexts/OrgContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface VenueSelectorProps {
  selectedVenueId: string | null;
  onSelect: (venueId: string | null) => void;
}

const VenueSelector = ({ selectedVenueId, onSelect }: VenueSelectorProps) => {
  const { venues, currentOrg } = useOrg();

  // Only show if multi-venue
  if (venues.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1">
        <Building2 className="w-3 h-3" />
        {currentOrg?.name}
      </Badge>
      <Select
        value={selectedVenueId || "all"}
        onValueChange={(val) => onSelect(val === "all" ? null : val)}
      >
        <SelectTrigger className="w-[180px] h-8 text-sm">
          <MapPin className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
          <SelectValue placeholder="All Venues" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Venues</SelectItem>
          {venues.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VenueSelector;
