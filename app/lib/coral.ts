interface SpeciesMapping {
  [key: string]: string;
}

const speciesMap: SpeciesMapping = {
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

export function parseCoralId(id: string): string {
  id = id.trim().toUpperCase();

  const newFormat = /^([A-Z]+)-?(\d+)$/;
  const newMatch = id.match(newFormat);

  if (newMatch) {
    const prefix = newMatch[1];
    const prefixMap: { [key: string]: string } = {
      OFAV: "OF",
      OANN: "OA",
      PAST: "PA",
      SINT: "SI",
      PSTR: "PD",
      DSTO: "DS",
      MCAV: "MC",
      OFRA: "OF",
    };

    const speciesCode = prefixMap[prefix];
    if (!speciesCode) throw new Error(`Unknown species prefix: ${prefix}`);

    return speciesMap[speciesCode];
  }

  const oldFormat = /^([A-Z]{2})(\d+)$/;
  const oldMatch = id.match(oldFormat);

  if (!oldMatch) throw new Error("Invalid coral ID format");

  const prefix = oldMatch[1];
  const speciesName = speciesMap[prefix];

  if (!speciesName) throw new Error("Unknown species code");

  return speciesName;
}

export function splitSpeciesName(fullName: string): {
  genus: string;
  species: string;
} {
  const [genus, ...speciesParts] = fullName.split(" ");
  return {
    genus,
    species: speciesParts.join(" "),
  };
}

export function listAllSpecies(): string[] {
  return Object.values(speciesMap);
}
