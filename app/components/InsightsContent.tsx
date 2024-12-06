"use client";

import { getInsights } from "@/app/actions/getInsights";
import { Tab } from "@headlessui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

type NurseryInventory = {
  nurseries: {
    name: string;
    totalCorals: number;
    genotypes: {
      id: string;
      quantity: number;
    }[];
  }[];
  genotypeDistribution: {
    id: string;
    totalQuantity: number;
    nurseryPresence: string[];
  }[];
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};

export default function InsightsContent() {
  const [data, setData] = useState<NurseryInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: "asc",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getInsights()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // sorts the data based on the key and direction
  const sortData = <T extends Record<string, any>>(
    items: T[],
    key: string
  ): T[] => {
    if (!key) return items;

    return [...items].sort((a, b) => {
      if (sortConfig.direction === "asc") {
        return a[key] > b[key] ? 1 : -1;
      }
      return a[key] < b[key] ? 1 : -1;
    });
  };

  const requestSort = (key: string) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const SortableHeader = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: string;
  }) => (
    <th
      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <span className="flex flex-col">
          <ChevronUpIcon
            className={`h-3 w-3 ${
              sortConfig.key === sortKey && sortConfig.direction === "asc"
                ? "text-blue-500"
                : "text-gray-400"
            }`}
          />
          <ChevronDownIcon
            className={`h-3 w-3 ${
              sortConfig.key === sortKey && sortConfig.direction === "desc"
                ? "text-blue-500"
                : "text-gray-400"
            }`}
          />
        </span>
      </div>
    </th>
  );

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search genotypes..."
            className="w-full px-4 py-2 border rounded-lg"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-4">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? "bg-white text-blue-700 shadow"
                  : "text-blue-500 hover:bg-white/[0.12] hover:text-blue-600"
              }`
              }
            >
              By Nursery
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? "bg-white text-blue-700 shadow"
                  : "text-blue-500 hover:bg-white/[0.12] hover:text-blue-600"
              }`
              }
            >
              By Genotype
            </Tab>
          </Tab.List>

          <Tab.Panels>
            <Tab.Panel>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Nursery" sortKey="name" />
                      <SortableHeader label="Genotype" sortKey="id" />
                      <SortableHeader label="Quantity" sortKey="quantity" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.nurseries.flatMap((nursery) =>
                      sortData(nursery.genotypes, sortConfig.key)
                        .filter((genotype) =>
                          genotype.id
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        )
                        .map((genotype) => (
                          <tr key={`${nursery.name}-${genotype.id}`}>
                            <td className="px-4 py-2">{nursery.name}</td>
                            <td className="px-4 py-2 font-mono">
                              {genotype.id}
                            </td>
                            <td className="px-4 py-2">{genotype.quantity}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </Tab.Panel>

            <Tab.Panel>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader label="Genotype" sortKey="id" />
                      <SortableHeader
                        label="Total Quantity"
                        sortKey="totalQuantity"
                      />
                      <SortableHeader
                        label="Nursery Count"
                        sortKey="nurseryPresence"
                      />
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Locations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortData(data.genotypeDistribution, sortConfig.key)
                      .filter((genotype) =>
                        genotype.id
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .map((genotype) => (
                        <tr key={genotype.id}>
                          <td className="px-4 py-2 font-mono">{genotype.id}</td>
                          <td className="px-4 py-2">
                            {genotype.totalQuantity}
                          </td>
                          <td className="px-4 py-2">
                            {genotype.nurseryPresence.length}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {genotype.nurseryPresence.join(", ")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
