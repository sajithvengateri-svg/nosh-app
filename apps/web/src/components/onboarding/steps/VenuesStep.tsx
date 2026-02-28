import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VenueInput } from "../OnboardingWizard";

interface VenuesStepProps {
  venues: VenueInput[];
  setVenues: (venues: VenueInput[]) => void;
}

const VenuesStep = ({ venues, setVenues }: VenuesStepProps) => {
  const addVenue = () => setVenues([...venues, { name: "", postcode: "" }]);
  const removeVenue = (i: number) => setVenues(venues.filter((_, idx) => idx !== i));
  const updateVenue = (i: number, field: keyof VenueInput, value: string) => {
    const updated = [...venues];
    updated[i][field] = value;
    setVenues(updated);
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">How many venues do you operate?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add each kitchen location. You can always add more later.
        </p>
      </div>
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {venues.map((venue, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <Input
              value={venue.name}
              onChange={(e) => updateVenue(i, "name", e.target.value)}
              placeholder="Venue name"
              className="flex-1"
            />
            <Input
              value={venue.postcode}
              onChange={(e) => updateVenue(i, "postcode", e.target.value)}
              placeholder="Postcode"
              className="w-24"
            />
            {venues.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeVenue(i)} className="flex-shrink-0">
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addVenue} className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Add Another Venue
      </Button>
    </div>
  );
};

export default VenuesStep;
