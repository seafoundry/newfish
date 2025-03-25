export function normalizeColumnHeader(header: string): string {
  return header.toLowerCase().trim();
}

export function findHeaderMatch(
  headers: string[],
  targetHeader: string
): string | null {
  const normalizedTarget = normalizeColumnHeader(targetHeader);
  const match = headers.find(
    (header) => normalizeColumnHeader(header) === normalizedTarget
  );
  return match || null;
}

export function normalizeObjectKeys<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  return Object.entries(obj).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      acc[normalizeColumnHeader(key)] = value;
      return acc;
    },
    {}
  );
}
