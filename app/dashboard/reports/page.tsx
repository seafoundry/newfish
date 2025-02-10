"use client";

import { getNurseries } from "@/app/actions/getNurseries";
import getOutplants from "@/app/actions/getOutplants";
import { generatePDF } from "@/app/components/ReportGenerator";
import { listAllSpecies, parseCoralId } from "@/app/lib/coral";
import { OutplantResponse } from "@/app/types/files";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { NurseryRow } from "@prisma/client";
import { Fragment, useEffect, useState } from "react";

type BoundingBox = {
  minLat: number | undefined;
  maxLat: number | undefined;
  minLng: number | undefined;
  maxLng: number | undefined;
};

type FilterState = {
  organizations: string[];
  sites: string[];
  species: string[];
  genotypes: string[];
  startDate: string;
  endDate: string;
  boundingBox: BoundingBox;
};

interface NurseryGroup {
  nursery: string;
  nurseryRows: NurseryRow[];
  geneticMappings: {
    id: string;
    userId: string;
    localGenetId: string;
    externalGenetId: string;
    createdAt: Date;
  }[];
}

export default function ReportsPage() {
  const [outplants, setOutplants] = useState<OutplantResponse[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    organizations: [],
    sites: [],
    species: [],
    genotypes: [],
    startDate: "",
    endDate: "",
    boundingBox: {
      minLat: undefined,
      maxLat: undefined,
      minLng: undefined,
      maxLng: undefined,
    },
  });
  const [selectedOutplant, setSelectedOutplant] =
    useState<OutplantResponse | null>(null);

  const [includeNurseryMappings, setIncludeNurseryMappings] = useState(false);
  const [nurseries, setNurseries] = useState<NurseryGroup[]>([]);

  const allOrganizations = [...new Set(outplants.map((o) => o.contact))];
  const allSites = [...new Set(outplants.map((o) => o.siteName))];
  const allSpecies = listAllSpecies();
  const allGenotypes = [
    ...new Set(outplants.flatMap((o) => o.genetics.map((g) => g.genotype))),
  ];

  useEffect(() => {
    getOutplants().then(setOutplants);
    getNurseries().then((data) => setNurseries(data));
  }, []);

  const filteredOutplants = outplants.filter((outplant) => {
    const dateInRange =
      (!filters.startDate ||
        new Date(outplant.date) >= new Date(filters.startDate)) &&
      (!filters.endDate ||
        new Date(outplant.date) <= new Date(filters.endDate));

    const matchesOrg =
      filters.organizations.length === 0 ||
      filters.organizations.includes(outplant.contact);

    const matchesSite =
      filters.sites.length === 0 || filters.sites.includes(outplant.siteName);

    const matchesSpecies =
      filters.species.length === 0 ||
      outplant.genetics.some((g) => {
        const species = parseCoralId(g.genotype);
        return filters.species.includes(species);
      });

    const matchesGenotype =
      filters.genotypes.length === 0 ||
      outplant.genetics.some((g) => filters.genotypes.includes(g.genotype));

    const matchesBoundingBox =
      !filters.boundingBox ||
      isInBoundingBox(outplant.coordinates, filters.boundingBox);

    return (
      dateInRange &&
      matchesOrg &&
      matchesSite &&
      matchesSpecies &&
      matchesGenotype &&
      matchesBoundingBox
    );
  });

  const updateBoundingBox = (field: keyof BoundingBox, value: string) => {
    setFilters((prev) => ({
      ...prev,
      boundingBox: {
        ...prev.boundingBox,
        [field]: value ? parseFloat(value) : undefined,
      },
    }));
  };

  const getRecentSpeciesData = (months: number, species: string) => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    return filteredOutplants.filter((outplant) => {
      const outplantDate = new Date(outplant.date);
      const hasSpecies = outplant.genetics.some(
        (g) => parseCoralId(g.genotype) === species
      );
      return outplantDate >= cutoffDate && hasSpecies;
    });
  };

  const getSpeciesInRegion = (species: string, boundingBox: BoundingBox) => {
    return filteredOutplants.filter((outplant) => {
      const hasSpecies = outplant.genetics.some(
        (g) => parseCoralId(g.genotype) === species
      );
      return hasSpecies && isInBoundingBox(outplant.coordinates, boundingBox);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Outplanting Reports</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organizations
              </label>
              <select
                multiple
                className="form-multiselect w-full rounded-md"
                value={filters.organizations}
                onChange={(e) => {
                  const values = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setFilters((prev) => ({ ...prev, organizations: values }));
                }}
              >
                {allOrganizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sites
              </label>
              <select
                multiple
                className="form-multiselect w-full rounded-md"
                value={filters.sites}
                onChange={(e) => {
                  const values = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setFilters((prev) => ({ ...prev, sites: values }));
                }}
              >
                {allSites.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Species
              </label>
              <select
                multiple
                className="form-multiselect w-full rounded-md"
                value={filters.species}
                onChange={(e) => {
                  const values = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setFilters((prev) => ({ ...prev, species: values }));
                }}
              >
                {allSpecies.map((species) => (
                  <option key={species} value={species}>
                    {species}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Date Range
              </label>
              <input
                type="date"
                className="form-input w-full rounded-md"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
              <input
                type="date"
                className="form-input w-full rounded-md"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Coordinate Boundaries
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min Lat"
                  className="form-input rounded-md"
                  value={filters.boundingBox.minLat ?? ""}
                  onChange={(e) => updateBoundingBox("minLat", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max Lat"
                  className="form-input rounded-md"
                  value={filters.boundingBox.maxLat ?? ""}
                  onChange={(e) => updateBoundingBox("maxLat", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Min Lng"
                  className="form-input rounded-md"
                  value={filters.boundingBox.minLng ?? ""}
                  onChange={(e) => updateBoundingBox("minLng", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max Lng"
                  className="form-input rounded-md"
                  value={filters.boundingBox.maxLng ?? ""}
                  onChange={(e) => updateBoundingBox("maxLng", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genotypes
              </label>
              <select
                multiple
                className="form-multiselect w-full rounded-md"
                value={filters.genotypes}
                onChange={(e) => {
                  const values = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setFilters((prev) => ({ ...prev, genotypes: values }));
                }}
              >
                {allGenotypes.map((genotype) => (
                  <option key={genotype} value={genotype}>
                    {genotype}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="includeMappings"
                type="checkbox"
                checked={includeNurseryMappings}
                onChange={(e) => setIncludeNurseryMappings(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label
                htmlFor="includeMappings"
                className="text-sm text-gray-700"
              >
                Include Nursery Mappings
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() =>
                generatePDF(
                  filteredOutplants,
                  includeNurseryMappings ? nurseries : []
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Generate Report
            </button>
          </div>
        </div>

        {includeNurseryMappings && nurseries.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Nursery Breakdown</h2>
            <div className="space-y-4">
              {nurseries.map((nurseryGroup) => (
                <details
                  key={nurseryGroup.nursery}
                  className="border rounded mb-2"
                >
                  <summary className="cursor-pointer px-4 py-2 font-medium">
                    {nurseryGroup.nursery}
                  </summary>
                  <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {nurseryGroup.nurseryRows.map((row, i) => {
                      const species = parseCoralId(row.genetId);
                      const mapping = nurseryGroup.geneticMappings.find(
                        (m) => m.localGenetId === row.genetId
                      );
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between border p-2 rounded ${
                            mapping
                              ? "bg-blue-50 border-blue-300"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="text-sm text-gray-600">
                            {species} ({row.genetId}): {row.quantity}
                          </div>
                          {mapping && (
                            <div className="text-xs text-blue-700">
                              external mapping: {mapping.externalGenetId}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Recent Species Activity (6 months)
              </h3>
              {allSpecies.map((species) => {
                const recentData = getRecentSpeciesData(6, species);
                if (recentData.length === 0) return null;

                const totalCorals = recentData.reduce(
                  (sum, o) =>
                    sum +
                    o.genetics.reduce(
                      (s, g) =>
                        parseCoralId(g.genotype) === species
                          ? s + g.quantity
                          : s,
                      0
                    ),
                  0
                );

                return (
                  <div key={species} className="p-4 bg-gray-50 rounded">
                    <p className="font-medium">{species}</p>
                    <p className="text-sm text-gray-600">
                      {totalCorals} corals planted across {recentData.length}{" "}
                      sites
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Regional Distribution</h3>
              {filters.boundingBox.minLat && (
                <div className="space-y-2">
                  {allSpecies.map((species) => {
                    const regionalData = getSpeciesInRegion(
                      species,
                      filters.boundingBox
                    );
                    if (regionalData.length === 0) return null;

                    const totalCorals = regionalData.reduce(
                      (sum, o) =>
                        sum +
                        o.genetics.reduce(
                          (s, g) =>
                            parseCoralId(g.genotype) === species
                              ? s + g.quantity
                              : s,
                          0
                        ),
                      0
                    );

                    return (
                      <div key={species} className="p-4 bg-gray-50 rounded">
                        <p className="font-medium">{species}</p>
                        <p className="text-sm text-gray-600">
                          {totalCorals} corals in selected region across{" "}
                          {regionalData.length} sites
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Site
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Species
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Corals
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOutplants.map((outplant) => (
                <tr
                  key={outplant.id}
                  onClick={() => setSelectedOutplant(outplant)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {outplant.siteName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(outplant.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {[
                      ...new Set(
                        outplant.genetics.map((g) => parseCoralId(g.genotype))
                      ),
                    ].join(", ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {outplant.genetics.reduce((sum, g) => sum + g.quantity, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Transition appear show={!!selectedOutplant} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-10 overflow-y-auto"
            onClose={() => setSelectedOutplant(null)}
          >
            <div className="min-h-screen px-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0">
                  <div className="absolute inset-0 bg-black opacity-30" />
                </div>
              </Transition.Child>

              <span
                className="inline-block h-screen align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative">
                  {selectedOutplant && (
                    <>
                      <button
                        onClick={() => setSelectedOutplant(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-6 w-6" />
                        <span className="sr-only">Close</span>
                      </button>

                      <Dialog.Title className="text-xl font-semibold mb-4 pr-8">
                        {selectedOutplant.siteName} -{" "}
                        {selectedOutplant.eventName}
                      </Dialog.Title>

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium">Location Details</h3>
                          <p>Coordinates: {selectedOutplant.coordinates}</p>
                          <p>Reef: {selectedOutplant.reefName}</p>
                        </div>

                        <div></div>
                        <h3 className="font-medium">Genotype Details</h3>
                        <div className="mt-2 space-y-2">
                          {selectedOutplant.genetics.map((genetic, idx) => (
                            <div key={idx} className="p-2 bg-gray-50 rounded">
                              <p>ID: {genetic.genotype}</p>
                              <p>Quantity: {genetic.quantity}</p>
                              <p>Accession: {genetic.assessionId}</p>
                              {genetic.geneticDetails && (
                                <details>
                                  <summary>Additional Details</summary>
                                  <pre className="text-xs mt-2">
                                    {JSON.stringify(
                                      genetic.geneticDetails,
                                      null,
                                      2
                                    )}
                                  </pre>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedOutplant(null)}
                        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Total Outplants</div>
              <div className="text-2xl font-bold">
                {filteredOutplants.length}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Total Corals</div>
              <div className="text-2xl font-bold">
                {filteredOutplants.reduce(
                  (sum, o) =>
                    sum + o.genetics.reduce((s, g) => s + g.quantity, 0),
                  0
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Unique Species</div>
              <div className="text-2xl font-bold">
                {
                  new Set(
                    filteredOutplants.flatMap((o) =>
                      o.genetics.map((g) => parseCoralId(g.genotype))
                    )
                  ).size
                }
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Sites</div>
              <div className="text-2xl font-bold">
                {new Set(filteredOutplants.map((o) => o.siteName)).size}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isInBoundingBox(
  coordinates: string,
  boundingBox: FilterState["boundingBox"]
) {
  if (!boundingBox) return true;
  const [lng, lat] = coordinates.split(",").map(Number);

  return (
    (!boundingBox.minLat || lat >= boundingBox.minLat) &&
    (!boundingBox.maxLat || lat <= boundingBox.maxLat) &&
    (!boundingBox.minLng || lng >= boundingBox.minLng) &&
    (!boundingBox.maxLng || lng <= boundingBox.maxLng)
  );
}
