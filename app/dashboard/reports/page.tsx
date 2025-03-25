"use client";

import getOutplants from "@/app/actions/getOutplants";
import { getUniqueSpecies } from "@/app/actions/getGeneticMappings";
import { getMonitoring, MonitoringResponse } from "@/app/actions/getMonitoring";
import { generateCSV } from "@/app/components/ReportGenerator";
import { parseCoralId } from "@/app/lib/coral";
import { OutplantResponse } from "@/app/types/files";
import { useEffect, useState } from "react";

type FilterState = {
  organizations: string[];
  sites: string[];
  species: string[];
  startDate: string;
  endDate: string;
};

interface OutplantWithMonitoring extends OutplantResponse {
  monitoring?: MonitoringResponse[];
  showMonitoring?: boolean;
}

export default function ReportsPage() {
  const [outplants, setOutplants] = useState<OutplantWithMonitoring[]>([]);
  const [monitoringData, setMonitoringData] = useState<MonitoringResponse[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    organizations: ["All Organizations"],
    sites: ["All Sites"],
    species: ["All Species"],
    startDate: "",
    endDate: "",
  });
  const [allSpecies, setAllSpecies] = useState<string[]>([]);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [outplantsData, monitoringResults] = await Promise.all([
          getOutplants(),
          getMonitoring().catch((err) => {
            console.error("Error loading monitoring data:", err);
            return [];
          }),
        ]);

        const monitoringByOutplant = new Map<string, MonitoringResponse[]>();
        monitoringResults.forEach((monitoring) => {
          if (!monitoringByOutplant.has(monitoring.eventId)) {
            monitoringByOutplant.set(monitoring.eventId, []);
          }
          monitoringByOutplant.get(monitoring.eventId)?.push(monitoring);
        });

        const outplantsWithMonitoring = outplantsData.map((outplant) => {
          const monitoring = monitoringByOutplant.get(outplant.id) || [];
          monitoring.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          return {
            ...outplant,
            monitoring,
            showMonitoring: false,
          };
        });

        setOutplants(outplantsWithMonitoring);
        setMonitoringData(monitoringResults);

        try {
          setIsLoadingSpecies(true);
          await getUniqueSpecies();

          const outplantSpecies = new Set<string>();
          outplantsData.forEach((outplant) => {
            outplant.genetics.forEach((genetic) => {
              try {
                const parsedId = parseCoralId(genetic.genotype);
                if (genetic.species) {
                  outplantSpecies.add(genetic.species);
                } else if (
                  parsedId.speciesName &&
                  parsedId.speciesName !== "Unknown species"
                ) {
                  outplantSpecies.add(parsedId.speciesName);
                }
              } catch (error) {
                console.warn(
                  `Could not parse species from genotype: ${genetic.genotype}`,
                  error
                );
              }
            });
          });

          const combinedSpecies = [
            "All Species",
            ...Array.from(outplantSpecies).sort(),
          ];
          setAllSpecies(combinedSpecies);
        } catch (error) {
          console.error("Failed to load species:", error);
        } finally {
          setIsLoadingSpecies(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const allOrganizations = [
    "All Organizations",
    ...new Set(outplants.map((o) => o.contact)),
  ];

  const allSites = ["All Sites", ...new Set(outplants.map((o) => o.siteName))];

  const filteredOutplants = outplants.filter((outplant) => {
    const dateInRange =
      (!filters.startDate ||
        new Date(outplant.date) >= new Date(filters.startDate)) &&
      (!filters.endDate ||
        new Date(outplant.date) <= new Date(filters.endDate));

    const matchesOrg =
      filters.organizations.includes("All Organizations") ||
      filters.organizations.includes(outplant.contact);

    const matchesSite =
      filters.sites.includes("All Sites") ||
      filters.sites.includes(outplant.siteName);

    const matchesSpecies =
      filters.species.includes("All Species") ||
      outplant.genetics.some((g) => {
        let speciesName = g.species;
        if (!speciesName) {
          try {
            const parsedId = parseCoralId(g.genotype);
            speciesName = parsedId.speciesName;
          } catch (error) {
            console.error("Error parsing coral ID:", error, g.genotype);
            return false;
          }
        }
        return filters.species.includes(speciesName);
      });

    return dateInRange && matchesOrg && matchesSite && matchesSpecies;
  });

  const toggleMonitoring = (outplantId: string) => {
    setOutplants((prev) =>
      prev.map((outplant) =>
        outplant.id === outplantId
          ? { ...outplant, showMonitoring: !outplant.showMonitoring }
          : outplant
      )
    );
  };

  const exportFilteredData = () => {
    const filteredOutplantIds = new Set(filteredOutplants.map((o) => o.id));
    const filteredMonitoring = monitoringData.filter((m) =>
      filteredOutplantIds.has(m.eventId)
    );

    generateCSV(filteredOutplants, filteredMonitoring);
  };

  const getSurvivalRateColor = (survivalRate: number) => {
    if (survivalRate === 0) return "text-gray-500";
    if (survivalRate >= 70) return "text-green-600";
    if (survivalRate >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const formatSpeciesList = (outplant: OutplantResponse): string => {
    const speciesSet = new Set<string>();

    outplant.genetics.forEach((genetic) => {
      if (genetic.species) {
        speciesSet.add(genetic.species);
      } else {
        try {
          const parsedId = parseCoralId(genetic.genotype);
          if (
            parsedId.speciesName &&
            parsedId.speciesName !== "Unknown species"
          ) {
            speciesSet.add(parsedId.speciesName);
          }
        } catch {
          console.warn(
            `Could not parse species from genotype: ${genetic.genotype}`
          );
        }
      }
    });

    return Array.from(speciesSet).join(", ");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl md:text-2xl font-bold">
              Outplanting Reports
            </h1>
            <button
              onClick={exportFilteredData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Export CSV
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organizations
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  value={filters.organizations}
                  onChange={(e) => {
                    const values = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setFilters((prev) => ({ ...prev, organizations: values }));
                  }}
                  multiple
                  size={3}
                >
                  {allOrganizations.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sites
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  value={filters.sites}
                  onChange={(e) => {
                    const values = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setFilters((prev) => ({ ...prev, sites: values }));
                  }}
                  multiple
                  size={3}
                >
                  {allSites.map((site) => (
                    <option key={site} value={site}>
                      {site}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Species
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  value={filters.species}
                  onChange={(e) => {
                    const values = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setFilters((prev) => ({ ...prev, species: values }));
                  }}
                  multiple
                  size={3}
                  disabled={isLoadingSpecies}
                >
                  {isLoadingSpecies ? (
                    <option>Loading species...</option>
                  ) : (
                    allSpecies.map((species) => (
                      <option key={species} value={species}>
                        {species}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      className="w-full rounded-md border-gray-300 shadow-sm"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      placeholder="Start Date"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      className="w-full rounded-md border-gray-300 shadow-sm"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      placeholder="End Date"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm text-blue-700">Total Outplants</div>
              <div className="text-2xl font-bold">
                {filteredOutplants.length}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-sm text-green-700">Total Corals</div>
              <div className="text-2xl font-bold">
                {filteredOutplants.reduce(
                  (sum, o) =>
                    sum + o.genetics.reduce((s, g) => s + g.quantity, 0),
                  0
                )}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-sm text-purple-700">Unique Species</div>
              <div className="text-2xl font-bold">
                {
                  new Set(
                    filteredOutplants
                      .flatMap((o) =>
                        o.genetics.map(
                          (g) =>
                            g.species || parseCoralId(g.genotype).speciesName
                        )
                      )
                      .filter(
                        (species) => species && species !== "Unknown species"
                      )
                  ).size
                }
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-sm text-amber-700">Sites</div>
              <div className="text-2xl font-bold">
                {new Set(filteredOutplants.map((o) => o.siteName)).size}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2">Loading outplanting data...</p>
            </div>
          ) : filteredOutplants.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                No outplanting events match your current filters
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Site
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Organization
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Species
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total Corals
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Latest Survival
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOutplants.map((outplant) => {
                    const hasMonitoring =
                      outplant.monitoring && outplant.monitoring.length > 0;
                    const latestMonitoring =
                      hasMonitoring && outplant.monitoring
                        ? outplant.monitoring[0]
                        : null;

                    let survivalRate = 0;
                    if (latestMonitoring?.outplantingEvent) {
                      survivalRate =
                        latestMonitoring.outplantingEvent.initialQuantity > 0
                          ? Math.round(
                              (latestMonitoring.qtySurvived /
                                latestMonitoring.outplantingEvent
                                  .initialQuantity) *
                                100
                            )
                          : 0;
                    }

                    return (
                      <>
                        <tr
                          key={outplant.id}
                          onClick={() => toggleMonitoring(outplant.id)}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            outplant.showMonitoring ? "bg-blue-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="font-medium text-gray-900">
                              {outplant.siteName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {outplant.reefName}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(outplant.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {outplant.contact}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatSpeciesList(outplant)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {outplant.genetics.reduce(
                              (sum, g) => sum + g.quantity,
                              0
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {hasMonitoring ? (
                              <div className="font-medium flex items-center space-x-1">
                                <span
                                  className={getSurvivalRateColor(survivalRate)}
                                >
                                  {survivalRate > 0
                                    ? `${survivalRate}%`
                                    : "No monitoring data"}
                                </span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`h-4 w-4 transition-transform ${
                                    outplant.showMonitoring ? "rotate-180" : ""
                                  }`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <span className="text-gray-400">No data</span>
                            )}
                          </td>
                        </tr>

                        {/* Monitoring data dropdown */}
                        {outplant.showMonitoring &&
                          outplant.monitoring &&
                          outplant.monitoring.length > 0 && (
                            <tr key={`${outplant.id}-monitoring`}>
                              <td colSpan={6} className="px-0 py-0">
                                <div className="bg-gray-50 p-4">
                                  <h3 className="text-sm font-medium mb-2">
                                    Monitoring History
                                  </h3>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                            Date
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                            Days Since Outplant
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                            Survived
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                            Initial
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                            Survival Rate
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200 bg-white">
                                        {outplant.monitoring.map(
                                          (monitoring) => {
                                            if (!monitoring.outplantingEvent)
                                              return null;

                                            const event =
                                              monitoring.outplantingEvent;
                                            const daysSince = Math.round(
                                              (new Date(
                                                monitoring.date
                                              ).getTime() -
                                                new Date(
                                                  outplant.date
                                                ).getTime()) /
                                                (1000 * 60 * 60 * 24)
                                            );

                                            const qtySurvived =
                                              typeof monitoring.qtySurvived ===
                                              "number"
                                                ? monitoring.qtySurvived
                                                : 0;
                                            const survivalRate =
                                              event.initialQuantity > 0
                                                ? Math.round(
                                                    (qtySurvived /
                                                      event.initialQuantity) *
                                                      100
                                                  )
                                                : 0;

                                            return (
                                              <tr
                                                key={monitoring.id}
                                                className="text-sm"
                                              >
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  {new Date(
                                                    monitoring.date
                                                  ).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  {daysSince} days
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  {qtySurvived}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  {event.initialQuantity}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  <span
                                                    className={`font-medium ${getSurvivalRateColor(
                                                      survivalRate
                                                    )}`}
                                                  >
                                                    {survivalRate > 0
                                                      ? `${survivalRate}%`
                                                      : "No monitoring data"}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                          }
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
