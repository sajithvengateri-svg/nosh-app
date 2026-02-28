import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Types ──────────────────────────────────────────────────────────

export interface CapturedPhoto {
  id: string;
  uri: string;
  caption?: string;
  timestamp: number;
}

// ── Store ──────────────────────────────────────────────────────────

interface PhotoState {
  photos: CapturedPhoto[];
  addPhoto: (uri: string, caption?: string) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;
}

export const usePhotoStore = create<PhotoState>()(
  persist(
    (set) => ({
      photos: [],

      addPhoto: (uri, caption) =>
        set((s) => ({
          photos: [
            {
              id: `photo-${Date.now()}`,
              uri,
              caption,
              timestamp: Date.now(),
            },
            ...s.photos,
          ],
        })),

      removePhoto: (id) =>
        set((s) => ({
          photos: s.photos.filter((p) => p.id !== id),
        })),

      clearPhotos: () => set({ photos: [] }),
    }),
    {
      name: "nosh-photos",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
