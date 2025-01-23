"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { OutplantResponse } from "../types/files";

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
  col1: { width: "40%" },
  col2: { width: "30%" },
  col3: { width: "30%" },
});

const OutplantReport = ({ outplants }: { outplants: OutplantResponse[] }) => (
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
              (sum, o) => sum + o.genetics.reduce((s, g) => s + g.quantity, 0),
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
    </Page>
  </Document>
);

export const generatePDF = async (outplants: OutplantResponse[]) => {
  const blob = await pdf(<OutplantReport outplants={outplants} />).toBlob();
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
