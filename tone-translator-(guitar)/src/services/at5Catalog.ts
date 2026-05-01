import catalogJson from "../data/amplitube5_gear_catalog.json";
import { AT5CatalogItem, AT5GearGroup } from "../types";

export const AT5_EMPTY_SLOT_GUID = "773b8ea7-b54a-4a3c-99df-ffbbf6d29271";

// Map snake_case JSON to camelCase interface
export const AT5_CATALOG: AT5CatalogItem[] = (catalogJson as any[]).map(item => ({
  group: item.group,
  guid: item.guid,
  slot: item.slot,
  displayName: item.display_name,
  otherNames: item.other_observed_names,
  usedInPresets: item.used_in_presets,
  examplePresets: item.example_presets,
  knobs: item.knobs,
  paramSuffix: item.paramSuffix
}));

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const scoreItem = (item: AT5CatalogItem, query: string): number => {
  const q = normalise(query);
  const names = [
    item.displayName,
    ...(item.otherNames ?? []),
    ...(item.examplePresets ?? []),
    item.guid,
  ].map(normalise);

  let score = 0;

  for (const name of names) {
    if (!name) continue;
    if (name === q) score += 1000;
    if (name.includes(q)) score += 250;
    if (q.includes(name)) score += 150;

    for (const token of q.split(" ")) {
      if (token.length >= 3 && name.includes(token)) score += 20;
    }
  }

  score += Math.min(item.usedInPresets ?? 0, 50);

  // Avoid fake / previously hallucinated ids.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.guid)) {
    score -= 10000;
  }

  return score;
};

export function findAT5Gear(
  query: string | undefined,
  group: AT5GearGroup
): AT5CatalogItem | undefined {
  if (!query) return undefined;

  return AT5_CATALOG
    .filter((item) => item.group === group)
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.item;
}

export function findAT5GearGuid(
  query: string | undefined,
  group: AT5GearGroup,
  fallbackGuid: string
): string {
  return findAT5Gear(query, group)?.guid ?? fallbackGuid;
}