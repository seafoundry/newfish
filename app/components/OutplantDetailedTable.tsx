"use client";

import { parseCoralId, splitSpeciesName } from "../lib/coral";
import { OutplantResponse } from "../types/files";

export default function OutplantDetailedTable(props: {
  outplants: OutplantResponse[];
}) {
  const tableData = props.outplants.flatMap((outplant) =>
    outplant.genetics.map((genetic) => {
      let speciesInfo = { genus: "N/A", species: "N/A" };
      try {
        const fullSpeciesName = parseCoralId(genetic.genotype);
        speciesInfo = splitSpeciesName(fullSpeciesName);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.warn(`Could not parse genotype: ${genetic.genotype}`);
      }

      return {
        genus: speciesInfo.genus,
        species: speciesInfo.species,
        genotype: genetic.genotype,
        accessionNumber: genetic.assessionId,
        colonies: genetic.quantity,
      };
    })
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Genus
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Species
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Genotype
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Accession Number
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Colonies
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tableData.map((row, idx) => (
                    <tr key={`${row.genotype}-${idx}`}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {row.genus}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {row.species}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {row.genotype}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {row.accessionNumber !== "None" ? (
                          <a
                            href={`https://www.crfcoralregistry.com/#main/3/registry/edit?id=${row.accessionNumber}`}
                            className="text-blue-500"
                          >
                            {row.accessionNumber}
                          </a>
                        ) : (
                          row.accessionNumber
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {row.colonies}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
