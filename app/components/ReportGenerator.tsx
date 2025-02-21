"use client";

import { parseCoralId } from "../lib/coral";
import { OutplantResponse } from "../types/files";

type NurseryGroup = {
  nursery: string;
  nurseryRows: {
    genetId: string;
    quantity: number;
  }[];
  geneticMappings: {
    localGenetId: string;
    externalGenetId: string;
  }[];
};

const generateCSV = (
  outplants: OutplantResponse[],
  nurseries: NurseryGroup[] = []
) => {
  const headers = [
    "Site",
    "Date",
    "Organization",
    "Species",
    "Genotype",
    "Quantity",
    "Coordinates",
    "Reef Name",
  ];

  const rows = outplants.flatMap((outplant) =>
    outplant.genetics.map((genetic) => [
      outplant.siteName,
      new Date(outplant.date).toISOString().split("T")[0],
      outplant.contact,
      parseCoralId(genetic.genotype),
      genetic.genotype,
      genetic.quantity,
      outplant.coordinates,
      outplant.reefName,
    ])
  );

  if (nurseries.length > 0) {
    headers.push("", "Nursery Data", "", "", "");
    rows.push([]);
    rows.push([
      "Nursery",
      "Species",
      "Genotype",
      "Quantity",
      "External Mapping",
    ]);

    nurseries.forEach((nurseryGroup) => {
      nurseryGroup.nurseryRows.forEach((row) => {
        const mapping = nurseryGroup.geneticMappings.find(
          (m) => m.localGenetId === row.genetId
        );
        rows.push([
          nurseryGroup.nursery,
          parseCoralId(row.genetId),
          row.genetId,
          row.quantity,
          mapping?.externalGenetId || "",
        ]);
      });
    });
  }

  const csvContent =
    headers.join(",") +
    "\n" +
    rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `coral-report-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export { generateCSV };
