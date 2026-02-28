"use client";

import React, { useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ImagePlus, X, Loader2, Camera, Utensils, Wine, DoorOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrandKitData {
  logo_url: string | null;
  hero_photos: string[];
  food_bev_photos: string[];
  room_photos: string[];
  show_logo: boolean;
  show_hero: boolean;
  show_food_bev: boolean;
  show_room: boolean;
}

export const DEFAULT_BRAND_KIT: BrandKitData = {
  logo_url: null,
  hero_photos: [],
  food_bev_photos: [],
  room_photos: [],
  show_logo: true,
  show_hero: true,
  show_food_bev: true,
  show_room: true,
};

interface VenueBrandKitProps {
  orgId: string;
  brandKit: BrandKitData;
  onChange: (kit: BrandKitData) => void;
  saving?: boolean;
}

// ---------------------------------------------------------------------------
// Upload helper
// ---------------------------------------------------------------------------

async function uploadToVenuePhotos(
  orgId: string,
  category: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${orgId}/${category}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("venue-photos")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("venue-photos").getPublicUrl(path);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Photo Grid sub-component
// ---------------------------------------------------------------------------

interface PhotoGridProps {
  photos: string[];
  category: string;
  orgId: string;
  onAdd: (url: string) => void;
  onRemove: (index: number) => void;
  maxPhotos?: number;
}

function PhotoGrid({
  photos,
  category,
  orgId,
  onAdd,
  onRemove,
  maxPhotos = 8,
}: PhotoGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) continue;
          const url = await uploadToVenuePhotos(orgId, category, file);
          onAdd(url);
        }
        toast.success(`Photo${files.length > 1 ? "s" : ""} uploaded`);
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [orgId, category, onAdd],
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((url, idx) => (
        <div
          key={idx}
          className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-[4/3]"
        >
          <img
            src={url}
            alt={`${category} ${idx + 1}`}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {photos.length < maxPhotos && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-vf-gold/40 aspect-[4/3] text-gray-400 hover:text-vf-gold transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="w-5 h-5" />
              <span className="text-[10px] mt-1">Upload</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Logo Upload sub-component
// ---------------------------------------------------------------------------

interface LogoUploadProps {
  logoUrl: string | null;
  orgId: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

function LogoUpload({ logoUrl, orgId, onUpload, onRemove }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const url = await uploadToVenuePhotos(orgId, "logo", file);
        onUpload(url);
        toast.success("Logo uploaded");
      } catch {
        toast.error("Logo upload failed");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [orgId, onUpload],
  );

  return (
    <div className="flex items-center gap-4">
      {logoUrl ? (
        <div className="relative group">
          <img
            src={logoUrl}
            alt="Venue logo"
            className="h-16 w-16 rounded-full object-cover border-2 border-vf-gold/30"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center h-16 w-16 rounded-full border-2 border-dashed border-gray-300 hover:border-vf-gold/40 text-gray-400 hover:text-vf-gold transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>
      )}
      <div className="text-sm">
        <p className="font-medium text-gray-700">Venue Logo</p>
        <p className="text-xs text-gray-400">Shown in nav, hero & footer</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function VenueBrandKit({
  orgId,
  brandKit,
  onChange,
  saving,
}: VenueBrandKitProps) {
  const update = useCallback(
    (partial: Partial<BrandKitData>) => {
      onChange({ ...brandKit, ...partial });
    },
    [brandKit, onChange],
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ImagePlus className="w-4 h-4 text-vf-gold" />
          Venue Brand Kit
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Upload your venue assets. These are used as defaults across all proposals.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Logo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-gray-400" />
              Logo
            </span>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-logo" className="text-xs text-gray-400">
                Show
              </Label>
              <Switch
                id="toggle-logo"
                checked={brandKit.show_logo}
                onCheckedChange={(v) => update({ show_logo: v })}
              />
            </div>
          </div>
          <LogoUpload
            logoUrl={brandKit.logo_url}
            orgId={orgId}
            onUpload={(url) => update({ logo_url: url })}
            onRemove={() => update({ logo_url: null })}
          />
        </div>

        {/* Hero Photos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5 text-gray-400" />
              Hero Photos
            </span>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-hero" className="text-xs text-gray-400">
                Show
              </Label>
              <Switch
                id="toggle-hero"
                checked={brandKit.show_hero}
                onCheckedChange={(v) => update({ show_hero: v })}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Large venue/atmosphere shots for the hero carousel
          </p>
          <PhotoGrid
            photos={brandKit.hero_photos}
            category="hero"
            orgId={orgId}
            onAdd={(url) =>
              update({ hero_photos: [...brandKit.hero_photos, url] })
            }
            onRemove={(idx) =>
              update({
                hero_photos: brandKit.hero_photos.filter((_, i) => i !== idx),
              })
            }
          />
        </div>

        {/* Food & Beverage Photos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-gray-400" />
              Food & Beverage
            </span>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-food" className="text-xs text-gray-400">
                Show
              </Label>
              <Switch
                id="toggle-food"
                checked={brandKit.show_food_bev}
                onCheckedChange={(v) => update({ show_food_bev: v })}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Food & drink photos for the menu gallery section
          </p>
          <PhotoGrid
            photos={brandKit.food_bev_photos}
            category="food-bev"
            orgId={orgId}
            onAdd={(url) =>
              update({ food_bev_photos: [...brandKit.food_bev_photos, url] })
            }
            onRemove={(idx) =>
              update({
                food_bev_photos: brandKit.food_bev_photos.filter(
                  (_, i) => i !== idx,
                ),
              })
            }
          />
        </div>

        {/* Room / Space Photos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5 text-gray-400" />
              Room / Space
            </span>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-room" className="text-xs text-gray-400">
                Show
              </Label>
              <Switch
                id="toggle-room"
                checked={brandKit.show_room}
                onCheckedChange={(v) => update({ show_room: v })}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Photos of the function room or private dining space
          </p>
          <PhotoGrid
            photos={brandKit.room_photos}
            category="room"
            orgId={orgId}
            onAdd={(url) =>
              update({ room_photos: [...brandKit.room_photos, url] })
            }
            onRemove={(idx) =>
              update({
                room_photos: brandKit.room_photos.filter(
                  (_, i) => i !== idx,
                ),
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
