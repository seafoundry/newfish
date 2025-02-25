"use client";

import { parseCoralId } from "../lib/coral";
import { OutplantResponse } from "../types/files";
import { MonitoringResponse } from "../actions/getMonitoring";

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
  monitoringData: MonitoringResponse[] = [],
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

  if (monitoringData.length > 0) {
    headers.push("", "Monitoring Data", "", "", "", "", "");
    rows.push([]);
    rows.push([
      "Site",
      "Outplanting Date",
      "Monitoring Date",
      "Event Name",
      "Initial Quantity",
      "Quantity Survived",
      "Survival Rate (%)",
    ]);

    console.log(
      `CSV Export: Processing ${monitoringData.length} monitoring entries`
    );

    const eventGroups = new Map<string, MonitoringResponse[]>();

    monitoringData.forEach((entry) => {
      console.log(
        `CSV Entry: eventId=${entry.eventId}, qtySurvived=${entry.qtySurvived}`
      );

      if (!eventGroups.has(entry.eventId)) {
        eventGroups.set(entry.eventId, []);
      }
      eventGroups.get(entry.eventId)?.push(entry);
    });

    console.log(`CSV Export: Grouped into ${eventGroups.size} event groups`);

    rows.push([
      "MONITORING DATA SUMMARY (Qty Survived Over Time)",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    if (eventGroups.size > 0) {
      rows.push([
        "Site",
        "Event Name",
        "Outplanting Date",
        "Latest Monitoring Date",
        "Initial Quantity",
        "Latest Quantity Survived",
        "Current Survival Rate",
      ]);

      Array.from(eventGroups.entries()).forEach(([, entries]) => {
        entries.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const latestEntry = entries[entries.length - 1];

        if (latestEntry?.outplantingEvent) {
          const event = latestEntry.outplantingEvent;
          const qtySurvived =
            typeof latestEntry.qtySurvived === "number"
              ? latestEntry.qtySurvived
              : 0;

          console.log(
            `CSV Export: Entry ${latestEntry.id} - Qty Survived:`,
            qtySurvived,
            "Raw value:",
            latestEntry.qtySurvived
          );

          const survivalRate =
            event.initialQuantity > 0
              ? Math.round((qtySurvived / event.initialQuantity) * 100)
              : 0;

          rows.push([
            event.siteName,
            event.eventName,
            new Date(event.date).toISOString().split("T")[0],
            new Date(latestEntry.date).toISOString().split("T")[0],
            event.initialQuantity,
            qtySurvived,
            `${survivalRate}%`,
          ]);
        }
      });
    }

    rows.push([]);
    rows.push(["DETAILED MONITORING DATA", "", "", "", "", "", ""]);

    rows.push([
      "Site",
      "Event Name",
      "Outplanting Date",
      "Monitoring Date",
      "Initial Quantity",
      "Quantity Survived",
      "Survival Rate",
    ]);

    eventGroups.forEach((entries) => {
      entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      entries.forEach((entry) => {
        if (entry.outplantingEvent) {
          const qtySurvived =
            typeof entry.qtySurvived === "number" ? entry.qtySurvived : 0;

          console.log(
            `CSV Export Detailed: Entry ${entry.id} - Qty Survived:`,
            qtySurvived,
            "Raw value:",
            entry.qtySurvived
          );

          const survivalRate =
            entry.outplantingEvent.initialQuantity > 0
              ? Math.round(
                  (qtySurvived / entry.outplantingEvent.initialQuantity) * 100
                )
              : 0;

          rows.push([
            entry.outplantingEvent.siteName,
            entry.outplantingEvent.eventName,
            new Date(entry.outplantingEvent.date).toISOString().split("T")[0],
            new Date(entry.date).toISOString().split("T")[0],
            entry.outplantingEvent.initialQuantity,
            qtySurvived,
            `${survivalRate}%`,
          ]);
        }
      });
    });
  }

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
