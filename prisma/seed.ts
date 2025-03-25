import { PrismaClient } from "@prisma/client";
import * as csv from "csv-parse";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const csvFilePath = path.join(__dirname, "../example_data/crf_genetics.csv");
  const fileContent = fs.readFileSync(csvFilePath, "utf-8");

  const parser = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  for await (const record of parser) {
    const localGenet = record["Local Genet"];
    const accessionNumber = record["Accession Number"];

    if (localGenet && accessionNumber) {
      console.log(
        `Local Genet: ${localGenet}, Accession Number: ${accessionNumber}`
      );
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
