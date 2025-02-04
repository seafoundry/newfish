"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
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

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 18, marginBottom: 10 },
  row: { flexDirection: "row", marginBottom: 5 },
  label: { width: 120, fontWeight: "bold" },
  value: { flex: 1 },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f0f0f0", padding: 5 },
  tableRow: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  col1: { width: "25%" },
  col2: { width: "25%" },
  col3: { width: "25%" },
  col4: { width: "25%" },
  speciesTable: { marginTop: 10, marginBottom: 15 },
  speciesRow: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  speciesCol1: { width: "40%" },
  speciesCol2: { width: "30%" },
  speciesCol3: { width: "30%" },
  monitoring: { marginTop: 10 },
  monitoringDate: { marginBottom: 5 },
});

type ReportProps = {
  outplants: OutplantResponse[];
  nurseries?: NurseryGroup[];
};

const OutplantReport = ({ outplants, nurseries = [] }: ReportProps) => {
  const speciesBreakdown = outplants.reduce(
    (acc: Record<string, number>, outplant) => {
      outplant.genetics.forEach((genetic) => {
        try {
          const species = parseCoralId(genetic.genotype);
          acc[species] = (acc[species] || 0) + genetic.quantity;
        } catch {
          acc["Unknown"] = (acc["Unknown"] || 0) + genetic.quantity;
        }
      });
      return acc;
    },
    {}
  );

  const getRecentSpeciesData = (months: number, species: string) => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    return outplants.filter((outplant) => {
      const outplantDate = new Date(outplant.date);
      const hasSpecies = outplant.genetics.some(
        (g) => parseCoralId(g.genotype) === species
      );
      return outplantDate >= cutoffDate && hasSpecies;
    });
  };

  const allSpecies = [
    ...new Set(
      outplants.flatMap((o) => o.genetics.map((g) => parseCoralId(g.genotype)))
    ),
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Outplanting Report</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Sites:</Text>
            <Text style={styles.value}>
              {new Set(outplants.map((o) => o.siteName)).size}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Outplants:</Text>
            <Text style={styles.value}>
              {outplants.reduce(
                (sum, o) =>
                  sum + o.genetics.reduce((s, g) => s + g.quantity, 0),
                0
              )}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Organizations:</Text>
            <Text style={styles.value}>
              {Array.from(new Set(outplants.map((o) => o.contact))).join(", ")}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outplant Details</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Site</Text>
              <Text style={styles.col2}>Date</Text>
              <Text style={styles.col3}>Total Corals</Text>
            </View>
            {outplants.map((outplant, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{outplant.siteName}</Text>
                <Text style={styles.col2}>
                  {new Date(outplant.date).toLocaleDateString()}
                </Text>
                <Text style={styles.col3}>
                  {outplant.genetics.reduce((sum, g) => sum + g.quantity, 0)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Species Breakdown</Text>
          <View style={styles.speciesTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.speciesCol1}>Species</Text>
              <Text style={styles.speciesCol2}>Total Colonies</Text>
              <Text style={styles.speciesCol3}>Percentage</Text>
            </View>
            {Object.entries(speciesBreakdown).map(([species, count], i) => {
              const percentage = (
                (count /
                  Object.values(speciesBreakdown).reduce((a, b) => a + b, 0)) *
                100
              ).toFixed(1);
              return (
                <View key={i} style={styles.speciesRow}>
                  <Text style={styles.speciesCol1}>{species}</Text>
                  <Text style={styles.speciesCol2}>{count}</Text>
                  <Text style={styles.speciesCol3}>{percentage}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Recent Activity (Last 6 Months)
          </Text>
          <View style={styles.table}>
            {allSpecies.map((species, i) => {
              const recentData = getRecentSpeciesData(6, species);
              if (recentData.length === 0) return null;

              const totalCorals = recentData.reduce(
                (sum, o) =>
                  sum +
                  o.genetics.reduce(
                    (s, g) =>
                      parseCoralId(g.genotype) === species ? s + g.quantity : s,
                    0
                  ),
                0
              );

              return (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.col1}>{species}</Text>
                  <Text style={styles.col2}>{totalCorals} corals</Text>
                  <Text style={styles.col3}>{recentData.length} sites</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitoring Timeline</Text>
          <View style={styles.monitoring}>
            {[...new Set(outplants.map((o) => o.date))]
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map((date, i) => (
                <View key={i} style={styles.monitoringDate}>
                  <Text>
                    {new Date(date).toLocaleDateString()}:{" "}
                    {outplants
                      .filter((o) => o.date === date)
                      .map((o) => o.siteName)
                      .join(", ")}
                  </Text>
                </View>
              ))}
          </View>
        </View>

        {nurseries.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nursery Data Summary</Text>
              <Text>Total Nurseries: {nurseries.length}</Text>
            </View>
            {(() => {
              const allNurseryRows = nurseries.flatMap((g) => g.nurseryRows);
              const aggregated = allNurseryRows.reduce((acc, row) => {
                let species = "Unknown";
                try {
                  species = parseCoralId(row.genetId);
                } catch {}
                if (!acc[species]) {
                  acc[species] = { quantity: 0, entries: 0 };
                }
                acc[species].quantity += row.quantity;
                acc[species].entries += 1;
                return acc;
              }, {} as Record<string, { quantity: number; entries: number }>);

              const allMappings = nurseries.flatMap((g) => g.geneticMappings);
              return (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.col1}>Species</Text>
                    <Text style={styles.col2}>Total Corals</Text>
                    <Text style={styles.col3}>Entries</Text>
                    <Text style={styles.col4}>External Mapping</Text>
                  </View>
                  {Object.entries(aggregated).map(([species, data], i) => {
                    const mappings = Array.from(
                      new Set(
                        allMappings
                          .filter((m) =>
                            species !== "Unknown"
                              ? (() => {
                                  try {
                                    return (
                                      parseCoralId(m.localGenetId) === species
                                    );
                                  } catch {
                                    return false;
                                  }
                                })()
                              : false
                          )
                          .map((m) => m.externalGenetId)
                      )
                    );
                    return (
                      <View key={i} style={styles.tableRow}>
                        <Text style={styles.col1}>{species}</Text>
                        <Text style={styles.col2}>{data.quantity}</Text>
                        <Text style={styles.col3}>{data.entries}</Text>
                        <Text style={styles.col4}>
                          {mappings.length > 0 ? mappings.join(", ") : "-"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </>
        )}
      </Page>
    </Document>
  );
};

export const generatePDF = async (
  outplants: OutplantResponse[],
  nurseries?: NurseryGroup[]
) => {
  const blob = await pdf(
    <OutplantReport outplants={outplants} nurseries={nurseries} />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `outplant-report-${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
