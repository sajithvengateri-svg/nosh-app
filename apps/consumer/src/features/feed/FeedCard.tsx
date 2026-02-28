import { RecipeCard, RecipeCardData } from "./RecipeCard";
import { TipCard, TipCardData } from "./TipCard";
import { WinePairingCard, WinePairingCardData } from "./WinePairingCard";
import { CocktailCard, CocktailCardData } from "./CocktailCard";
import { ChefSpotlightCard, ChefSpotlightCardData } from "./ChefSpotlightCard";
import { VendorCard, VendorCardData } from "./VendorCard";
import { ExpiryAlertCard, ExpiryAlertCardData } from "./ExpiryAlertCard";
import { ReadyToCookCard, ReadyToCookCardData } from "./ReadyToCookCard";
import { SocialEventCard, SocialEventCardData } from "./SocialEventCard";
import NoshDnaCard, { NoshDnaCardData } from "./NoshDnaCard";
import { WeeklyPlannerCard, WeeklyPlannerData } from "./WeeklyPlannerCard";
import { PhotoGalleryCard } from "./PhotoGalleryCard";
import { LifecycleGuideCard } from "./LifecycleGuideCard";
import { NoshPlusCard, NoshPlusCardData } from "./NoshPlusCard";
import { SavingsCard, SavingsCardData } from "./SavingsCard";
import { LeftoverCard, LeftoverCardData } from "./LeftoverCard";

export type FeedCardType =
  | "recipe"
  | "tip"
  | "wine_pairing"
  | "cocktail"
  | "chef_spotlight"
  | "vendor"
  | "expiry_alert"
  | "playlist"
  | "adventure"
  | "larderchef"
  | "cook_group_share"
  | "ready_to_cook"
  | "social_event"
  | "nosh_dna"
  | "weekly_planner"
  | "photo_gallery"
  | "lifecycle_guide"
  | "nosh_plus"
  | "savings"
  | "leftover_suggestion";

export interface FeedCardItem {
  id: string;
  type: FeedCardType;
  score?: number;
  data: any;
}

export function FeedCard({ item, onOpenOverlay }: { item: FeedCardItem; onOpenOverlay?: (key: string) => void }) {
  switch (item.type) {
    case "recipe":
      return <RecipeCard recipe={item.data as RecipeCardData} onOpenOverlay={onOpenOverlay} />;
    case "tip":
      return <TipCard tip={item.data as TipCardData} />;
    case "wine_pairing":
      return <WinePairingCard wine={item.data as WinePairingCardData} />;
    case "cocktail":
      return <CocktailCard cocktail={item.data as CocktailCardData} />;
    case "chef_spotlight":
      return <ChefSpotlightCard data={item.data as ChefSpotlightCardData} />;
    case "vendor":
      return <VendorCard data={item.data as VendorCardData} />;
    case "expiry_alert":
      return <ExpiryAlertCard data={item.data as ExpiryAlertCardData} />;
    case "ready_to_cook":
      return <ReadyToCookCard data={item.data as ReadyToCookCardData} />;
    case "social_event":
      return <SocialEventCard data={item.data as SocialEventCardData} onOpenOverlay={onOpenOverlay} />;
    case "nosh_dna":
      return <NoshDnaCard data={item.data as NoshDnaCardData} onOpenOverlay={onOpenOverlay} />;
    case "weekly_planner":
      return <WeeklyPlannerCard data={item.data as WeeklyPlannerData} onOpenOverlay={onOpenOverlay} />;
    case "photo_gallery":
      return <PhotoGalleryCard />;
    case "lifecycle_guide":
      return <LifecycleGuideCard onOpenOverlay={onOpenOverlay} />;
    case "nosh_plus":
      return <NoshPlusCard data={item.data as NoshPlusCardData} />;
    case "savings":
      return <SavingsCard data={item.data as SavingsCardData} />;
    case "leftover_suggestion":
      return <LeftoverCard data={item.data as LeftoverCardData} />;
    default:
      // Placeholder for unimplemented card types
      return null;
  }
}
