import { FileCategory } from "./files";

export const requiredColumnHeaders: Record<FileCategory, string[]> = {
  Genetics: ["Local ID/Genet Propagation", "Species"],
  Nursery: ["Local ID", "Quantity", "Nursery"],
  Outplanting: ["Local ID", "Quantity", "Tag"],
  Monitoring: ["Qty Survived"],
  GeneticsMapping: [],
};

export const templateColumnHeaders: Record<FileCategory, string[]> = {
  Genetics: ["Local ID/Genet Propagation", "Accession Number", "Species"],
  Nursery: ["Local ID", "Quantity", "Nursery"],
  Outplanting: ["Local ID", "Quantity", "Tag"],
  Monitoring: ["Local ID", "Qty Survived", "Notes"],
  GeneticsMapping: ["Your Genotype ID", "External Genotype ID"],
};

export function normalizeColumnHeader(header: string): string {
  return header.toLowerCase().trim();
}

export function matchColumnHeader(
  actualHeader: string,
  expectedHeader: string
): boolean {
  return (
    normalizeColumnHeader(actualHeader) ===
    normalizeColumnHeader(expectedHeader)
  );
}

export function findExactHeaderName(
  normalizedHeader: string,
  category: FileCategory
): string | null {
  const headers = requiredColumnHeaders[category];
  for (const header of headers) {
    if (normalizeColumnHeader(header) === normalizedHeader) {
      return header;
    }
  }
  return null;
}
