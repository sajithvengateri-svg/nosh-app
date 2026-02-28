import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import type { ResTag, TagCategory } from "@/lib/shared/types/res.types";
import { fetchOrgTags } from "@/lib/shared/queries/resQueries";

const TAG_CATEGORIES: TagCategory[] = [
  "general",
  "dietary",
  "vip",
  "occasion",
  "operational",
];

function groupByCategory(tags: ResTag[]): Record<TagCategory, ResTag[]> {
  const grouped = {} as Record<TagCategory, ResTag[]>;
  for (const category of TAG_CATEGORIES) {
    grouped[category] = [];
  }
  for (const tag of tags) {
    if (grouped[tag.category]) {
      grouped[tag.category].push(tag);
    }
  }
  return grouped;
}

export function useOrgTags() {
  const { currentOrg } = useOrg();

  const { data: tags = [], isLoading } = useQuery<ResTag[]>({
    queryKey: ["orgTags", currentOrg?.id],
    queryFn: async () => {
      const { data, error } = await fetchOrgTags(currentOrg!.id);
      if (error) {
        console.warn("[useOrgTags] query error:", error.message);
        return [];
      }
      return data ?? [];
    },
    enabled: !!currentOrg?.id,
    staleTime: 10 * 60 * 1000,
    retry: false,
    select: (data) =>
      [...data].sort((a, b) => {
        const catIndexA = TAG_CATEGORIES.indexOf(a.category);
        const catIndexB = TAG_CATEGORIES.indexOf(b.category);
        if (catIndexA !== catIndexB) return catIndexA - catIndexB;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      }),
  });

  const tagsByCategory = useMemo(() => groupByCategory(tags), [tags]);

  const getTagByName = useCallback(
    (name: string): ResTag | undefined => {
      return tags.find((tag) => tag.name === name);
    },
    [tags],
  );

  return {
    tags,
    tagsByCategory,
    getTagByName,
    isLoading,
  };
}
