export const PROGRAM_TRAINING_SECTORS = [
  {
    name: "Hospitality",
    aliases: ["hospitality"],
    occupationAliases: [],
  },
  {
    name: "Manufactur",
    aliases: ["manufactur", "manufaktur", "manufacturing"],
    occupationAliases: [],
  },
  {
    name: "Caregiver",
    aliases: ["caregiver", "care giver", "care-giving"],
    occupationAliases: [],
  },
  {
    name: "Health",
    aliases: ["health", "healthcare", "health care", "kesehatan"],
    occupationAliases: [],
  },
  {
    name: "Fisherman",
    aliases: [
      "fisherman",
      "fisherman (agricultur)",
      "fishery",
      "agricultur",
      "agriculture",
      "perikanan",
      "pertanian",
    ],
    occupationAliases: ["fisherman", "fishermen", "abk fishermen"],
  },
] as const;

function normalizeValue(value: string): string {
  return value.trim().toLocaleLowerCase("id-ID");
}

export function getProgramTrainingSectorName(
  sectorName: string,
  occupationName: string,
): string | null {
  const normalizedSectorName = normalizeValue(sectorName);
  const normalizedOccupationName = normalizeValue(occupationName);
  const sector = PROGRAM_TRAINING_SECTORS.find(
    (item) =>
      item.aliases.some((alias) => alias === normalizedSectorName) ||
      item.occupationAliases.some(
        (alias) => alias === normalizedOccupationName,
      ),
  );

  return sector?.name ?? null;
}
