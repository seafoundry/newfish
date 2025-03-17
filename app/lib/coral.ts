export interface SpeciesMapping {
  [key: string]: string;
}

export const speciesMap: SpeciesMapping = {
  MC: "Montastraea cavernosa",
  OF: "Orbicella faveolata",
  AB: "Acropora abrolhosensis",
  AC: "Acropora cervicornis",
  CY: "Acropora cytherea",
  AF: "Acropora formosa",
  HY: "Acropora hyacinthus",
  LO: "Acropora longicyathus",
  AP: "Acropora palmata",
  PR: "Acropora prolifera",
  AS: "Acropora species",
  AG: "Agaricia agaricites",
  HU: "Agaricia humilis",
  CN: "Colpophyllia natans",
  DC: "Dendrogyra cylindrus",
  DS: "Dichocoenia stokesii",
  DL: "Diploria labyrinthiformis",
  EF: "Eusmilia fastigiata",
  FF: "Favia fragum",
  MD: "Madracis decactis",
  SE: "Madracis senaria",
  AR: "Manicina areolata",
  MM: "Meandrina meandrites",
  MO: "Montipora foliosa",
  AL: "Mycetophyllia aliciae",
  MX: "Mycetophyllia ferox",
  ML: "Mycetophyllia lamarckiana",
  OA: "Orbicella annularis",
  OK: "Orbicella franksi",
  OS: "Orbicella species",
  PA: "Porites asteroides",
  PP: "Porites porites",
  PO: "Porites species",
  PC: "Pseudodiploria clivosa",
  PD: "Pseudodiploria strigosa",
  SC: "Scolymia cubensis",
  SR: "Siderastrea radians",
  SS: "Siderastrea siderea",
  SB: "Solenastrea bournoni",
  SI: "Stephanocoenia intersepta",
  SM: "Stephanocoenia michelini",
  XM: "Xestospongia muta",
  UN: "unknown unknown",
};

export const fullSpeciesMap: Record<
  string,
  { genus: string; species: string }
> = {
  MCAV: { genus: "Montastraea", species: "cavernosa" },
  OFAV: { genus: "Orbicella", species: "faveolata" },
  OANN: { genus: "Orbicella", species: "annularis" },
  OFRA: { genus: "Orbicella", species: "franksi" },
  PAST: { genus: "Porites", species: "asteroides" },
  PPOR: { genus: "Porites", species: "porites" },
  APAL: { genus: "Acropora", species: "palmata" },
  ACER: { genus: "Acropora", species: "cervicornis" },
  SINT: { genus: "Stephanocoenia", species: "intersepta" },
  DSTO: { genus: "Dichocoenia", species: "stokesii" },
  PSTR: { genus: "Pseudodiploria", species: "strigosa" },
  PCLI: { genus: "Pseudodiploria", species: "clivosa" },
  CNAT: { genus: "Colpophyllia", species: "natans" },
  DCYL: { genus: "Dendrogyra", species: "cylindrus" },

  MC: { genus: "Montastraea", species: "cavernosa" },
  OF: { genus: "Orbicella", species: "faveolata" },
  OA: { genus: "Orbicella", species: "annularis" },
  OK: { genus: "Orbicella", species: "franksi" },
  PA: { genus: "Porites", species: "asteroides" },
  PP: { genus: "Porites", species: "porites" },
  AP: { genus: "Acropora", species: "palmata" },
  AC: { genus: "Acropora", species: "cervicornis" },
  SI: { genus: "Stephanocoenia", species: "intersepta" },
  DS: { genus: "Dichocoenia", species: "stokesii" },
  PD: { genus: "Pseudodiploria", species: "strigosa" },
  PC: { genus: "Pseudodiploria", species: "clivosa" },
  CN: { genus: "Colpophyllia", species: "natans" },
  DC: { genus: "Dendrogyra", species: "cylindrus" },

  PS: { genus: "Pseudodiploria", species: "strigosa" },
  "PS-": { genus: "Pseudodiploria", species: "strigosa" },
  PS14: { genus: "Pseudodiploria", species: "strigosa" },
  PS2: { genus: "Pseudodiploria", species: "strigosa" },
  PS3: { genus: "Pseudodiploria", species: "strigosa" },
};

export interface ParsedCoralId {
  speciesName: string;
  localId: string;
  originalId: string;
  format: "standard" | "old" | "mote" | "unknown";
}

/**
 * Parse a coral ID to extract species information and local ID
 *
 * Handles multiple formats:
 * - Standard format: XXXX-000 (e.g., OFAV-047, PAST-041)
 * - Old format: XX000 (e.g., AP123, MC456)
 * - Mote format: XX000 (e.g., AP275) - handled via genetics_mapping.csv
 *
 * @param id The coral ID to parse
 * @returns Parsed coral ID with species name, local ID, and format information
 */
export function parseCoralId(id: string): ParsedCoralId {
  if (!id) {
    return {
      speciesName: "Unknown species",
      localId: id || "",
      originalId: id || "",
      format: "unknown",
    };
  }

  id = id.trim().toUpperCase();
  const originalId = id;

  if (id.startsWith("PS")) {
    return {
      speciesName: "Pseudodiploria strigosa",
      localId: id,
      originalId,
      format: "standard",
    };
  }

  const standardFormat = /^([A-Z]+)-?(\d+)$/;
  const standardMatch = id.match(standardFormat);

  if (standardMatch) {
    const prefix = standardMatch[1];
    const number = standardMatch[2];
    const localId = `${prefix}-${number}`;

    const speciesDetails = fullSpeciesMap[prefix];

    if (speciesDetails) {
      const speciesName = `${speciesDetails.genus} ${speciesDetails.species}`;

      return {
        speciesName,
        localId,
        originalId,
        format: "standard",
      };
    }

    const prefixMap: { [key: string]: string } = {
      OFAV: "OF",
      OANN: "OA",
      PAST: "PA",
      SINT: "SI",
      PSTR: "PD",
      DSTO: "DS",
      MCAV: "MC",
      OFRA: "OF",
      AP: "AP",
    };

    const speciesCode = prefixMap[prefix] || prefix;
    const speciesName = speciesMap[speciesCode] || "Unknown species";

    return {
      speciesName,
      localId,
      originalId,
      format: "standard",
    };
  }

  const oldFormat = /^([A-Z]{2})(\d+)$/;
  const oldMatch = id.match(oldFormat);

  if (oldMatch) {
    const prefix = oldMatch[1];
    const number = oldMatch[2];
    const localId = `${prefix}${number}`;

    const speciesDetails = fullSpeciesMap[prefix];

    if (speciesDetails) {
      const speciesName = `${speciesDetails.genus} ${speciesDetails.species}`;

      return {
        speciesName,
        localId,
        originalId,
        format: "old",
      };
    }

    const speciesName = speciesMap[prefix] || "Unknown species";

    return {
      speciesName,
      localId,
      originalId,
      format: "old",
    };
  }

  return {
    speciesName: "Unknown species",
    localId: id,
    originalId,
    format: "unknown",
  };
}

export function splitSpeciesName(fullName: string): {
  genus: string;
  species: string;
} {
  if (!fullName.includes(" ")) {
    const lowerCaseName = fullName.toLowerCase();

    const knownSpecies = [
      "asteroides",
      "faveolata",
      "annularis",
      "franksi",
      "cavernosa",
      "intersepta",
      "strigosa",
      "clivosa",
      "stokesii",
      "natans",
      "cylindrus",
    ];

    if (knownSpecies.includes(lowerCaseName)) {
      const genusMap: Record<string, string> = {
        asteroides: "Porites",
        faveolata: "Orbicella",
        annularis: "Orbicella",
        franksi: "Orbicella",
        cavernosa: "Montastraea",
        intersepta: "Stephanocoenia",
        strigosa: "Pseudodiploria",
        clivosa: "Pseudodiploria",
        stokesii: "Dichocoenia",
        natans: "Colpophyllia",
        cylindrus: "Dendrogyra",
      };

      return {
        genus: genusMap[lowerCaseName] || "Unknown",
        species: fullName,
      };
    }

    return {
      genus: fullName,
      species: "",
    };
  }

  const [genus, ...speciesParts] = fullName.split(" ");
  return {
    genus,
    species: speciesParts.join(" "),
  };
}

export function listAllSpecies(): string[] {
  return Object.values(speciesMap);
}
