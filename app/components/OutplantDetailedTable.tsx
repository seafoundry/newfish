"use client";

import React, { useState } from "react";
import { MonitoringResponse } from "../actions/getMonitoring";
import { parseCoralId, splitSpeciesName } from "../lib/coral";
import { OutplantResponse } from "../types/files";
import { deleteOutplantingEvent } from "../actions/deleteOutplantingEvent";
import { useRouter } from "next/navigation";

interface GeneticWithDetails {
  genus: string;
  species: string;
  genotype: string;
  uniqueGenotype: string;
  localId: string;
  grouping: string;
  accessionNumber: string;
  colonies: number;
}

export default function OutplantDetailedTable(props: {
  outplants: OutplantResponse[];
  monitoringData?: MonitoringResponse[];
  showSurvivalData?: boolean;
}) {
  const router = useRouter();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grouping" | "localId" | "species">(
    "grouping"
  );
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteOutplantingEvent = async (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this outplanting event? This will also delete any associated monitoring data.")) {
      setIsDeleting(prev => ({ ...prev, [eventId]: true }));
      try {
        const result = await deleteOutplantingEvent(eventId);
        if (!result.success) {
          setDeleteError(result.message);
        } else {
          router.refresh();
        }
      } catch (error) {
        setDeleteError("Failed to delete outplanting event");
        console.error("Error deleting outplanting event:", error);
      } finally {
        setIsDeleting(prev => ({ ...prev, [eventId]: false }));
      }
    }
  };

  const eventGroups = props.outplants.map((outplant) => {
    const genetics: GeneticWithDetails[] = outplant.genetics.map((genetic) => {
      let speciesInfo = { genus: "N/A", species: "N/A" };
      try {
        const parsedId = parseCoralId(genetic.genotype);

        if (genetic.species && genetic.species !== "Unknown species") {
          if (genetic.species.includes(" ")) {
            speciesInfo = splitSpeciesName(genetic.species);
          } else {
            if (
              genetic.species.charAt(0).toLowerCase() ===
              genetic.species.charAt(0)
            ) {
              const knownSpecies = [
                "asteroides",
                "faveolata",
                "annularis",
                "franksi",
                "cavernosa",
                "intersepta",
                "strigosa",
                "clivosa",
                "stokesii",
                "natans",
                "cylindrus",
              ];

              if (knownSpecies.includes(genetic.species.toLowerCase())) {
                const genusMap: Record<string, string> = {
                  asteroides: "Porites",
                  faveolata: "Orbicella",
                  annularis: "Orbicella",
                  franksi: "Orbicella",
                  cavernosa: "Montastraea",
                  intersepta: "Stephanocoenia",
                  strigosa: "Pseudodiploria",
                  clivosa: "Pseudodiploria",
                  stokesii: "Dichocoenia",
                  natans: "Colpophyllia",
                  cylindrus: "Dendrogyra",
                };

                speciesInfo = {
                  genus: genusMap[genetic.species.toLowerCase()] || "Unknown",
                  species: genetic.species,
                };
              } else {
                speciesInfo = {
                  genus: "Unknown",
                  species: genetic.species,
                };
              }
            } else {
              speciesInfo = {
                genus: genetic.species,
                species: "",
              };
            }
          }
        } else if (
          parsedId.speciesName &&
          parsedId.speciesName !== "Unknown species"
        ) {
          speciesInfo = splitSpeciesName(parsedId.speciesName);
        }
      } catch (err) {
        console.warn(`Could not parse genotype: ${genetic.genotype}`, err);
      }

      const accessionNumber =
        genetic.assessionId && genetic.assessionId !== "None"
          ? genetic.assessionId || genetic.assessionId
          : "None";

      let fixedGenus = speciesInfo.genus === "N/A" ? "" : speciesInfo.genus;
      let fixedSpecies =
        speciesInfo.species === "N/A" ? "" : speciesInfo.species;

      if (fixedGenus === "Straigosa" || fixedGenus === "straigosa") {
        fixedGenus = "Pseudodiploria";
        fixedSpecies = "strigosa";
      }

      if (genetic.genotype.startsWith("PS") && !fixedGenus) {
        fixedGenus = "Pseudodiploria";

        if (!fixedSpecies) {
          fixedSpecies = "strigosa";
        }
      }

      const knownSpecies = [
        "faveolata",
        "annularis",
        "franksi",
        "cavernosa",
        "intersepta",
        "strigosa",
        "clivosa",
        "stokesii",
        "natans",
        "cylindrus",
        "asteroides",
      ];

      if (knownSpecies.includes(fixedGenus.toLowerCase())) {
        const genusMap: Record<string, string> = {
          faveolata: "Orbicella",
          annularis: "Orbicella",
          franksi: "Orbicella",
          cavernosa: "Montastraea",
          intersepta: "Stephanocoenia",
          strigosa: "Pseudodiploria",
          clivosa: "Pseudodiploria",
          stokesii: "Dichocoenia",
          natans: "Colpophyllia",
          cylindrus: "Dendrogyra",
          asteroides: "Porites",
        };

        fixedSpecies = fixedGenus;
        fixedGenus = genusMap[fixedGenus.toLowerCase()] || "Unknown";
      }

      return {
        genus: fixedGenus,
        species: fixedSpecies,
        genotype: genetic.genotype,
        uniqueGenotype:
          genetic.uniqueGenotype ||
          `${genetic.genotype}__group_${genetic.grouping}`,
        localId: genetic.localId,
        grouping: genetic.grouping,
        accessionNumber: accessionNumber,
        colonies: genetic.quantity,
      };
    });

    const monitoring = props.monitoringData?.find(
      (m) => m.eventId === outplant.id
    );

    let survivalRate = null;
    const geneticSurvivalData: Array<{
      genotype: string;
      localId: string;
      grouping: string;
      survived: number;
      initial: number;
      rate: number;
      level: "tag" | "localId" | "grouping" | "estimated";
    }> = [];
    const localIdSurvivalData = new Map<
      string,
      {
        localId: string;
        survived: number;
        initial: number;
        rate: number;
        tags: string[];
      }
    >();

    const groupingSurvivalData = new Map<
      string,
      {
        grouping: string;
        survived: number;
        initial: number;
        rate: number;
        tags: string[];
      }
    >();

    if (monitoring && monitoring.outplantingEvent) {
      survivalRate =
        monitoring.outplantingEvent.survivalDetails?.overall.rate ||
        (monitoring.outplantingEvent.initialQuantity > 0
          ? Math.round(
              (monitoring.qtySurvived /
                monitoring.outplantingEvent.initialQuantity) *
                100
            )
          : null);

      if (monitoring.outplantingEvent.survivalDetails) {
        const survivalDetails = monitoring.outplantingEvent.survivalDetails;

        if (survivalDetails.byLocalId) {
          Object.entries(survivalDetails.byLocalId).forEach(
            ([localId, data]) => {
              localIdSurvivalData.set(localId, {
                localId,
                survived: data.survived,
                initial: data.initial,
                rate: data.rate,
                tags: data.tags || [],
              });
            }
          );
        }

        if (survivalDetails.byTag) {
          const genotypeToGrouping = new Map<string, string>();
          outplant.genetics.forEach((genetic) => {
            genotypeToGrouping.set(genetic.genotype, genetic.grouping);
          });

          Object.entries(survivalDetails.byTag).forEach(([tag, data]) => {
            const grouping = genotypeToGrouping.get(tag) || "unknown";
            if (!groupingSurvivalData.has(grouping)) {
              groupingSurvivalData.set(grouping, {
                grouping,
                survived: 0,
                initial: 0,
                rate: 0,
                tags: [],
              });
            }

            const groupData = groupingSurvivalData.get(grouping)!;
            groupData.survived += data.survived;
            groupData.initial += data.initial;
            if (groupData.initial > 0) {
              groupData.rate = Math.round(
                (groupData.survived / groupData.initial) * 100
              );
            }
            groupData.tags.push(tag);
          });
        }

        genetics.forEach((genetic) => {
          let survivalInfo = null;
          const { localId, grouping } = genetic;

          if (
            survivalDetails.byTag &&
            (survivalDetails.byTag[genetic.uniqueGenotype] ||
              survivalDetails.byTag[genetic.genotype])
          ) {
            const tagData =
              survivalDetails.byTag[genetic.uniqueGenotype] ||
              survivalDetails.byTag[genetic.genotype];
            survivalInfo = {
              genotype: genetic.uniqueGenotype,
              localId,
              grouping,
              survived: tagData.survived,
              initial: tagData.initial,
              rate: tagData.rate,
              level: "tag" as const,
            };
          } else if (grouping && groupingSurvivalData.has(grouping)) {
            const groupingData = groupingSurvivalData.get(grouping);
            if (groupingData) {
              const groupTotal = genetics
                .filter((g) => g.grouping === grouping)
                .reduce((sum, g) => sum + g.colonies, 0);

              const proportionalSurvival =
                groupTotal > 0
                  ? Math.round(
                      (genetic.colonies / groupTotal) * groupingData.survived
                    )
                  : 0;

              survivalInfo = {
                genotype: genetic.genotype,
                localId,
                grouping,
                survived: proportionalSurvival,
                initial: genetic.colonies,
                rate:
                  genetic.colonies > 0
                    ? Math.round(
                        (proportionalSurvival / genetic.colonies) * 100
                      )
                    : 0,
                level: "grouping" as const,
              };
            }
          } else if (localId && localIdSurvivalData.has(localId)) {
            const localIdData = localIdSurvivalData.get(localId);
            if (localIdData) {
              const localIdTotal = genetics
                .filter((g) => g.localId === localId)
                .reduce((sum, g) => sum + g.colonies, 0);

              const proportionalSurvival =
                localIdTotal > 0
                  ? Math.round(
                      (genetic.colonies / localIdTotal) * localIdData.survived
                    )
                  : 0;

              survivalInfo = {
                genotype: genetic.genotype,
                localId,
                grouping,
                survived: proportionalSurvival,
                initial: genetic.colonies,
                rate:
                  genetic.colonies > 0
                    ? Math.round(
                        (proportionalSurvival / genetic.colonies) * 100
                      )
                    : 0,
                level: "localId" as const,
              };
            }
          } else {
            const initialQty = genetic.colonies;
            const proportionalSurvival = Math.round(
              (initialQty /
                (monitoring.outplantingEvent?.initialQuantity || 1)) *
                monitoring.qtySurvived
            );

            survivalInfo = {
              genotype: genetic.genotype,
              localId,
              grouping,
              survived: proportionalSurvival,
              initial: initialQty,
              rate:
                initialQty > 0
                  ? Math.round((proportionalSurvival / initialQty) * 100)
                  : 0,
              level: "estimated" as const,
            };
          }

          if (survivalInfo) {
            geneticSurvivalData.push(survivalInfo);
          }
        });

        geneticSurvivalData.sort((a, b) => {
          if (a.grouping !== b.grouping) {
            return a.grouping.localeCompare(b.grouping);
          }
          if (a.localId !== b.localId) {
            return a.localId.localeCompare(b.localId);
          }
          return a.genotype.localeCompare(b.genotype);
        });
      }
    }

    return {
      id: outplant.id,
      siteName: outplant.siteName,
      reefName: outplant.reefName,
      date: outplant.date,
      organization: outplant.contact,
      totalColonies: outplant.genetics.reduce((sum, g) => sum + g.quantity, 0),
      species: [
        ...new Set(
          outplant.genetics.map(
            (g) => g.species || parseCoralId(g.genotype).speciesName
          )
        ),
      ],
      genetics,
      monitoring: monitoring
        ? {
            date: monitoring.date,
            qtySurvived: monitoring.qtySurvived,
            initialQuantity: monitoring.outplantingEvent?.initialQuantity || 0,
            survivalRate,
            survivalDetails: monitoring.outplantingEvent?.survivalDetails,
            geneticSurvivalData:
              geneticSurvivalData.length > 0 ? geneticSurvivalData : null,
            allMonitoringEvents: monitoring.allMonitoringEvents || [],
          }
        : null,
    };
  });

  return (
    <div className="max-w-7xl mx-auto p-4">
      {deleteError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{deleteError}</span>
          <span 
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setDeleteError(null)}
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        </div>
      )}
      <div className="mb-4">
        <div className="flex items-center justify-end space-x-4">
          <div className="text-sm text-gray-600">Group by:</div>
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grouping")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "grouping"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Tags
            </button>
            <button
              onClick={() => setViewMode("localId")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "localId"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Local ID
            </button>
            <button
              onClick={() => setViewMode("species")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "species"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Species
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Site
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Organization
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Species
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Total Colonies
                    </th>
                    {props.showSurvivalData && (
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Survival
                      </th>
                    )}
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {eventGroups.map((event) => (
                    <>
                      <tr
                        key={event.id}
                        className={`${
                          expandedEvent === event.id
                            ? "bg-blue-50"
                            : "hover:bg-gray-50"
                        } cursor-pointer`}
                        onClick={() =>
                          setExpandedEvent(
                            expandedEvent === event.id ? null : event.id
                          )
                        }
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {event.siteName}
                          <div className="text-xs text-gray-500">
                            {event.reefName}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {event.organization}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {event.species.join(", ")}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {event.totalColonies}
                        </td>
                        {props.showSurvivalData && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            {event.monitoring ? (
                              <div
                                className={`font-medium ${
                                  event.monitoring.survivalRate &&
                                  event.monitoring.survivalRate > 0
                                    ? event.monitoring.survivalRate >= 70
                                      ? "text-green-600"
                                      : event.monitoring.survivalRate >= 40
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {event.monitoring.qtySurvived} of{" "}
                                {event.monitoring.initialQuantity}
                                {event.monitoring.survivalRate && event.monitoring.survivalRate > 0
                                  ? ` (${event.monitoring.survivalRate}%)`
                                  : " (No monitoring data)"}
                              </div>
                            ) : (
                              <span className="text-gray-400">No data</span>
                            )}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                setExpandedEvent(
                                  expandedEvent === event.id ? null : event.id
                                )
                              }
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              {expandedEvent === event.id ? "Hide" : "Show"}{" "}
                              Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOutplantingEvent(event.id);
                              }}
                              disabled={isDeleting[event.id]}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                              {isDeleting[event.id] ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedEvent === event.id && (
                        <tr key={`${event.id}-details`}>
                          <td
                            colSpan={props.showSurvivalData ? 7 : 6}
                            className="px-4 py-4 bg-gray-50"
                          >
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 border">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                      Genus
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                      Species
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                      Genotype
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                      Accession #
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                      Quantity
                                    </th>
                                    {props.showSurvivalData &&
                                      event.monitoring?.geneticSurvivalData && (
                                        <>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                            Survived
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                            Survival Rate
                                          </th>
                                        </>
                                      )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                  {(() => {
                                    const geneticsByGrouping: Record<
                                      string,
                                      {
                                        genetics: GeneticWithDetails[];
                                        localIds: string[];
                                      }
                                    > = {};

                                    const geneticsByLocalId: Record<
                                      string,
                                      {
                                        genetics: GeneticWithDetails[];
                                        groupings: string[];
                                      }
                                    > = {};

                                    const geneticsBySpecies: Record<
                                      string,
                                      {
                                        genetics: GeneticWithDetails[];
                                        localIds: string[];
                                        groupings: string[];
                                      }
                                    > = {};

                                    const geneticsByLocalIdAndGroup: Record<
                                      string,
                                      Record<string, GeneticWithDetails[]>
                                    > = {};

                                    const geneticsByGroupingAndLocalId: Record<
                                      string,
                                      Record<string, GeneticWithDetails[]>
                                    > = {};

                                    const geneticsBySpeciesAndLocalId: Record<
                                      string,
                                      Record<string, GeneticWithDetails[]>
                                    > = {};

                                    event.genetics.forEach((genetic) => {
                                      const grouping =
                                        genetic.grouping || "unspecified";
                                      const localId =
                                        genetic.localId ||
                                        genetic.genotype.split("-")[0];
                                      const species =
                                        `${genetic.genus} ${genetic.species}`.trim() ||
                                        "Unknown Species";

                                      if (!geneticsByGrouping[grouping]) {
                                        geneticsByGrouping[grouping] = {
                                          genetics: [],
                                          localIds: [],
                                        };
                                        geneticsByLocalIdAndGroup[grouping] =
                                          {};
                                      }

                                      geneticsByGrouping[
                                        grouping
                                      ].genetics.push(genetic);

                                      if (
                                        !geneticsByLocalIdAndGroup[grouping][
                                          localId
                                        ]
                                      ) {
                                        geneticsByLocalIdAndGroup[grouping][
                                          localId
                                        ] = [];
                                        if (
                                          !geneticsByGrouping[
                                            grouping
                                          ].localIds.includes(localId)
                                        ) {
                                          geneticsByGrouping[
                                            grouping
                                          ].localIds.push(localId);
                                        }
                                      }

                                      geneticsByLocalIdAndGroup[grouping][
                                        localId
                                      ].push(genetic);

                                      if (!geneticsByLocalId[localId]) {
                                        geneticsByLocalId[localId] = {
                                          genetics: [],
                                          groupings: [],
                                        };
                                        geneticsByGroupingAndLocalId[localId] =
                                          {};
                                      }

                                      geneticsByLocalId[localId].genetics.push(
                                        genetic
                                      );

                                      if (
                                        !geneticsByGroupingAndLocalId[localId][
                                          grouping
                                        ]
                                      ) {
                                        geneticsByGroupingAndLocalId[localId][
                                          grouping
                                        ] = [];
                                        if (
                                          !geneticsByLocalId[
                                            localId
                                          ].groupings.includes(grouping)
                                        ) {
                                          geneticsByLocalId[
                                            localId
                                          ].groupings.push(grouping);
                                        }
                                      }

                                      geneticsByGroupingAndLocalId[localId][
                                        grouping
                                      ].push(genetic);

                                      if (!geneticsBySpecies[species]) {
                                        geneticsBySpecies[species] = {
                                          genetics: [],
                                          localIds: [],
                                          groupings: [],
                                        };
                                        geneticsBySpeciesAndLocalId[species] =
                                          {};
                                      }

                                      geneticsBySpecies[species].genetics.push(
                                        genetic
                                      );

                                      if (
                                        !geneticsBySpeciesAndLocalId[species][
                                          localId
                                        ]
                                      ) {
                                        geneticsBySpeciesAndLocalId[species][
                                          localId
                                        ] = [];
                                        if (
                                          !geneticsBySpecies[
                                            species
                                          ].localIds.includes(localId)
                                        ) {
                                          geneticsBySpecies[
                                            species
                                          ].localIds.push(localId);
                                        }
                                      }

                                      geneticsBySpeciesAndLocalId[species][
                                        localId
                                      ].push(genetic);

                                      if (
                                        !geneticsBySpecies[
                                          species
                                        ].groupings.includes(grouping)
                                      ) {
                                        geneticsBySpecies[
                                          species
                                        ].groupings.push(grouping);
                                      }
                                    });

                                    const groupingStats: Record<
                                      string,
                                      {
                                        initial: number;
                                        survived: number;
                                        rate: number;
                                      }
                                    > = {};

                                    const localIdStats: Record<
                                      string,
                                      {
                                        initial: number;
                                        survived: number;
                                        rate: number;
                                      }
                                    > = {};

                                    const speciesStats: Record<
                                      string,
                                      {
                                        initial: number;
                                        survived: number;
                                        rate: number;
                                      }
                                    > = {};

                                    if (event.monitoring?.geneticSurvivalData) {
                                      Object.keys(geneticsByGrouping).forEach(
                                        (grouping) => {
                                          groupingStats[grouping] = {
                                            initial: 0,
                                            survived: 0,
                                            rate: 0,
                                          };
                                        }
                                      );

                                      Object.keys(geneticsByLocalId).forEach(
                                        (localId) => {
                                          localIdStats[localId] = {
                                            initial: 0,
                                            survived: 0,
                                            rate: 0,
                                          };
                                        }
                                      );

                                      Object.keys(geneticsBySpecies).forEach(
                                        (species) => {
                                          speciesStats[species] = {
                                            initial: 0,
                                            survived: 0,
                                            rate: 0,
                                          };
                                        }
                                      );

                                      event.monitoring.geneticSurvivalData.forEach(
                                        (survivalData) => {
                                          const genetic = event.genetics.find(
                                            (g) =>
                                              g.uniqueGenotype ===
                                                survivalData.genotype ||
                                              g.genotype ===
                                                survivalData.genotype
                                          );

                                          if (!genetic) return;

                                          const grouping = genetic.grouping;
                                          const localId = genetic.localId;
                                          const species =
                                            `${genetic.genus} ${genetic.species}`.trim() ||
                                            "Unknown Species";

                                          if (groupingStats[grouping]) {
                                            groupingStats[grouping].initial +=
                                              survivalData.initial;
                                            groupingStats[grouping].survived +=
                                              survivalData.survived;
                                          }

                                          if (localIdStats[localId]) {
                                            localIdStats[localId].initial +=
                                              survivalData.initial;
                                            localIdStats[localId].survived +=
                                              survivalData.survived;
                                          }

                                          if (speciesStats[species]) {
                                            speciesStats[species].initial +=
                                              survivalData.initial;
                                            speciesStats[species].survived +=
                                              survivalData.survived;
                                          }
                                        }
                                      );

                                      Object.keys(groupingStats).forEach(
                                        (key) => {
                                          const stats = groupingStats[key];
                                          stats.rate =
                                            stats.initial > 0
                                              ? Math.round(
                                                  (stats.survived /
                                                    stats.initial) *
                                                    100
                                                )
                                              : 0;
                                        }
                                      );

                                      Object.keys(localIdStats).forEach(
                                        (key) => {
                                          const stats = localIdStats[key];
                                          stats.rate =
                                            stats.initial > 0
                                              ? Math.round(
                                                  (stats.survived /
                                                    stats.initial) *
                                                    100
                                                )
                                              : 0;
                                        }
                                      );

                                      Object.keys(speciesStats).forEach(
                                        (key) => {
                                          const stats = speciesStats[key];
                                          stats.rate =
                                            stats.initial > 0
                                              ? Math.round(
                                                  (stats.survived /
                                                    stats.initial) *
                                                    100
                                                )
                                              : 0;
                                        }
                                      );
                                    }

                                    if (viewMode === "grouping") {
                                      return Object.entries(
                                        geneticsByGrouping
                                      ).map(([grouping, groupData]) => {
                                        const groupingStatData =
                                          groupingStats[grouping];

                                        return (
                                          <React.Fragment
                                            key={`grouping-${grouping}`}
                                          >
                                            <tr className="bg-blue-50 text-xs font-semibold">
                                              <td
                                                colSpan={2}
                                                className="px-3 py-2 font-medium"
                                              >
                                                Grouping: {grouping}
                                              </td>
                                              <td
                                                colSpan={1}
                                                className="px-3 py-2"
                                              >
                                                {groupData.localIds.length}{" "}
                                                Local ID
                                                {groupData.localIds.length !== 1
                                                  ? "s"
                                                  : ""}
                                              </td>
                                              <td className="px-3 py-2">-</td>
                                              <td className="px-3 py-2">
                                                Total:{" "}
                                                {groupData.genetics.reduce(
                                                  (sum, g) => sum + g.colonies,
                                                  0
                                                )}
                                              </td>
                                              {props.showSurvivalData &&
                                                event.monitoring
                                                  ?.geneticSurvivalData && (
                                                  <>
                                                    <td className="px-3 py-2">
                                                      Survived:{" "}
                                                      {groupingStatData?.survived ||
                                                        0}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <span
                                                        className={`font-medium ${
                                                          (groupingStatData?.rate ||
                                                            0) >= 70
                                                            ? "text-green-600"
                                                            : (groupingStatData?.rate ||
                                                                0) >= 40
                                                            ? "text-yellow-600"
                                                            : "text-red-600"
                                                        }`}
                                                      >
                                                        {groupingStatData?.rate ||
                                                          0}
                                                        % Survival
                                                      </span>
                                                    </td>
                                                  </>
                                                )}
                                            </tr>

                                            {groupData.genetics.map(
                                              (genetic, idx) => {
                                                const survivalData =
                                                  event.monitoring?.geneticSurvivalData?.find(
                                                    (sd) =>
                                                      sd.genotype ===
                                                        genetic.uniqueGenotype ||
                                                      sd.genotype ===
                                                        genetic.genotype
                                                  );

                                                return (
                                                  <tr
                                                    key={`${
                                                      genetic.uniqueGenotype ||
                                                      genetic.genotype
                                                    }-${idx}`}
                                                    className="text-xs"
                                                  >
                                                    <td className="whitespace-nowrap px-3 py-2 font-medium">
                                                      {genetic.genus}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                      {genetic.species}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2 font-mono">
                                                      {genetic.genotype}{" "}
                                                      <span className="text-gray-400">
                                                        (ID: {genetic.localId})
                                                      </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                      {genetic.accessionNumber !==
                                                      "None" ? (
                                                        <a
                                                          href={`https://www.crfcoralregistry.com/#main/3/registry/edit?id=${genetic.accessionNumber}`}
                                                          className="text-blue-500"
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                        >
                                                          {
                                                            genetic.accessionNumber
                                                          }
                                                        </a>
                                                      ) : (
                                                        genetic.accessionNumber
                                                      )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                      {genetic.colonies}
                                                    </td>
                                                    {props.showSurvivalData &&
                                                      event.monitoring
                                                        ?.geneticSurvivalData && (
                                                        <>
                                                          <td className="whitespace-nowrap px-3 py-2">
                                                            {survivalData
                                                              ? survivalData.survived
                                                              : "N/A"}
                                                          </td>
                                                          <td className="whitespace-nowrap px-3 py-2">
                                                            {survivalData ? (
                                                              <span
                                                                className={`font-medium ${
                                                                  survivalData.rate >=
                                                                  70
                                                                    ? "text-green-600"
                                                                    : survivalData.rate >=
                                                                      40
                                                                    ? "text-yellow-600"
                                                                    : "text-red-600"
                                                                }`}
                                                              >
                                                                {
                                                                  survivalData.rate
                                                                }
                                                                %
                                                              </span>
                                                            ) : (
                                                              "N/A"
                                                            )}
                                                          </td>
                                                        </>
                                                      )}
                                                  </tr>
                                                );
                                              }
                                            )}
                                          </React.Fragment>
                                        );
                                      });
                                    } else if (viewMode === "localId") {
                                      return Object.entries(
                                        geneticsByLocalId
                                      ).map(([localId, localIdData]) => {
                                        const localIdStatData =
                                          localIdStats[localId];

                                        return (
                                          <React.Fragment
                                            key={`localid-${localId}`}
                                          >
                                            <tr className="bg-green-50 text-xs font-semibold">
                                              <td
                                                colSpan={2}
                                                className="px-3 py-2 font-medium"
                                              >
                                                Local ID: {localId}
                                              </td>
                                              <td
                                                colSpan={1}
                                                className="px-3 py-2"
                                              >
                                                {localIdData.groupings.length}{" "}
                                                Group
                                                {localIdData.groupings
                                                  .length !== 1
                                                  ? "s"
                                                  : ""}
                                              </td>
                                              <td className="px-3 py-2">
                                                {localIdData.genetics[0]
                                                  ?.accessionNumber !== "None"
                                                  ? localIdData.genetics[0]
                                                      ?.accessionNumber
                                                  : "None"}
                                              </td>
                                              <td className="px-3 py-2">
                                                Total:{" "}
                                                {localIdData.genetics.reduce(
                                                  (sum, g) => sum + g.colonies,
                                                  0
                                                )}
                                              </td>
                                              {props.showSurvivalData &&
                                                event.monitoring
                                                  ?.geneticSurvivalData && (
                                                  <>
                                                    <td className="px-3 py-2">
                                                      Survived:{" "}
                                                      {localIdStatData?.survived ||
                                                        0}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <span
                                                        className={`font-medium ${
                                                          (localIdStatData?.rate ||
                                                            0) >= 70
                                                            ? "text-green-600"
                                                            : (localIdStatData?.rate ||
                                                                0) >= 40
                                                            ? "text-yellow-600"
                                                            : "text-red-600"
                                                        }`}
                                                      >
                                                        {localIdStatData?.rate ||
                                                          0}
                                                        % Survival
                                                      </span>
                                                    </td>
                                                  </>
                                                )}
                                            </tr>

                                            {localIdData.genetics.map(
                                              (genetic, idx) => {
                                                const survivalData =
                                                  event.monitoring?.geneticSurvivalData?.find(
                                                    (sd) =>
                                                      sd.genotype ===
                                                        genetic.uniqueGenotype ||
                                                      sd.genotype ===
                                                        genetic.genotype
                                                  );

                                                return (
                                                  <tr
                                                    key={`${
                                                      genetic.uniqueGenotype ||
                                                      genetic.genotype
                                                    }-${idx}`}
                                                    className="text-xs"
                                                  >
                                                    <td className="whitespace-nowrap px-3 py-2 font-medium">
                                                      {genetic.genus}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                      {genetic.species}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2 font-mono">
                                                      {genetic.genotype}{" "}
                                                      <span className="text-gray-400">
                                                        (Group:{" "}
                                                        {genetic.grouping})
                                                      </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                      {genetic.accessionNumber !==
                                                      "None" ? (
                                                        <a
                                                          href={`https://www.crfcoralregistry.com/#main/3/registry/edit?id=${genetic.accessionNumber}`}
                                                          className="text-blue-500"
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                        >
                                                          {
                                                            genetic.accessionNumber
                                                          }
                                                        </a>
                                                      ) : (
                                                        genetic.accessionNumber
                                                      )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                      {genetic.colonies}
                                                    </td>
                                                    {props.showSurvivalData &&
                                                      event.monitoring
                                                        ?.geneticSurvivalData && (
                                                        <>
                                                          <td className="whitespace-nowrap px-3 py-2">
                                                            {survivalData
                                                              ? survivalData.survived
                                                              : "N/A"}
                                                          </td>
                                                          <td className="whitespace-nowrap px-3 py-2">
                                                            {survivalData ? (
                                                              <span
                                                                className={`font-medium ${
                                                                  survivalData.rate >=
                                                                  70
                                                                    ? "text-green-600"
                                                                    : survivalData.rate >=
                                                                      40
                                                                    ? "text-yellow-600"
                                                                    : "text-red-600"
                                                                }`}
                                                              >
                                                                {
                                                                  survivalData.rate
                                                                }
                                                                %
                                                              </span>
                                                            ) : (
                                                              "N/A"
                                                            )}
                                                          </td>
                                                        </>
                                                      )}
                                                  </tr>
                                                );
                                              }
                                            )}
                                          </React.Fragment>
                                        );
                                      });
                                    } else {
                                      return Object.entries(
                                        geneticsBySpecies
                                      ).map(([species, speciesData]) => {
                                        const speciesStatData =
                                          speciesStats[species];

                                        return (
                                          <React.Fragment
                                            key={`species-${species}`}
                                          >
                                            <tr className="bg-purple-50 text-xs font-semibold">
                                              <td
                                                colSpan={2}
                                                className="px-3 py-2 font-medium"
                                              >
                                                Species: {species}
                                              </td>
                                              <td
                                                colSpan={1}
                                                className="px-3 py-2"
                                              >
                                                {speciesData.localIds.length}{" "}
                                                Local ID
                                                {speciesData.localIds.length !==
                                                1
                                                  ? "s"
                                                  : ""}
                                              </td>
                                              <td className="px-3 py-2">-</td>
                                              <td className="px-3 py-2">
                                                Total:{" "}
                                                {speciesData.genetics.reduce(
                                                  (sum, g) => sum + g.colonies,
                                                  0
                                                )}
                                              </td>
                                              {props.showSurvivalData &&
                                                event.monitoring
                                                  ?.geneticSurvivalData && (
                                                  <>
                                                    <td className="px-3 py-2">
                                                      Survived:{" "}
                                                      {speciesStatData?.survived ||
                                                        0}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                      <span
                                                        className={`font-medium ${
                                                          (speciesStatData?.rate ||
                                                            0) >= 70
                                                            ? "text-green-600"
                                                            : (speciesStatData?.rate ||
                                                                0) >= 40
                                                            ? "text-yellow-600"
                                                            : "text-red-600"
                                                        }`}
                                                      >
                                                        {speciesStatData?.rate ||
                                                          0}
                                                        % Survival
                                                      </span>
                                                    </td>
                                                  </>
                                                )}
                                            </tr>

                                            {speciesData.genetics.map(
                                              (genetic, idx) => {
                                                const survivalData =
                                                  event.monitoring?.geneticSurvivalData?.find(
                                                    (sd) =>
                                                      sd.genotype ===
                                                        genetic.uniqueGenotype ||
                                                      sd.genotype ===
                                                        genetic.genotype
                                                  );

                                                return (
                                                  <tr
                                                    key={`${
                                                      genetic.uniqueGenotype ||
                                                      genetic.genotype
                                                    }-${idx}`}
                                                    className="text-xs"
                                                  >
                                                    <td className="whitespace-nowrap px-3 py-2 font-medium">
                                                      {genetic.genus}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                      {genetic.species}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2 font-mono">
                                                      {genetic.genotype}{" "}
                                                      <span className="text-gray-400">
                                                        (ID: {genetic.localId},
                                                        Group:{" "}
                                                        {genetic.grouping})
                                                      </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                      {genetic.accessionNumber !==
                                                      "None" ? (
                                                        <a
                                                          href={`https://www.crfcoralregistry.com/#main/3/registry/edit?id=${genetic.accessionNumber}`}
                                                          className="text-blue-500"
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                        >
                                                          {
                                                            genetic.accessionNumber
                                                          }
                                                        </a>
                                                      ) : (
                                                        genetic.accessionNumber
                                                      )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                      {genetic.colonies}
                                                    </td>
                                                    {props.showSurvivalData &&
                                                      event.monitoring
                                                        ?.geneticSurvivalData && (
                                                        <>
                                                          <td className="whitespace-nowrap px-3 py-2">
                                                            {survivalData
                                                              ? survivalData.survived
                                                              : "N/A"}
                                                          </td>
                                                          <td className="whitespace-nowrap px-3 py-2">
                                                            {survivalData ? (
                                                              <span
                                                                className={`font-medium ${
                                                                  survivalData.rate >=
                                                                  70
                                                                    ? "text-green-600"
                                                                    : survivalData.rate >=
                                                                      40
                                                                    ? "text-yellow-600"
                                                                    : "text-red-600"
                                                                }`}
                                                              >
                                                                {
                                                                  survivalData.rate
                                                                }
                                                                %
                                                              </span>
                                                            ) : (
                                                              "N/A"
                                                            )}
                                                          </td>
                                                        </>
                                                      )}
                                                  </tr>
                                                );
                                              }
                                            )}
                                          </React.Fragment>
                                        );
                                      });
                                    }
                                  })()}
                                </tbody>
                              </table>
                            </div>

                            {props.showSurvivalData && event.monitoring && (
                              <div className="mt-4 space-y-3">
                                <h4 className="text-sm font-medium mb-2">
                                  Monitoring Data
                                </h4>

                                {/* Most recent monitoring data card */}
                                <div className="p-3 border rounded bg-white">
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="font-medium text-sm">
                                      Most Recent (
                                      {new Date(
                                        event.monitoring.date
                                      ).toLocaleDateString()}
                                      )
                                    </div>
                                    <div
                                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                                        event.monitoring.survivalRate &&
                                        event.monitoring.survivalRate >= 70
                                          ? "bg-green-100 text-green-800"
                                          : event.monitoring.survivalRate &&
                                            event.monitoring.survivalRate >= 40
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {event.monitoring.survivalRate}% Survival
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 text-xs gap-3">
                                    <div>
                                      <div className="text-gray-500">
                                        Initial Quantity at Outplanting
                                      </div>
                                      <div className="font-medium">
                                        {event.monitoring.initialQuantity}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">
                                        Current Surviving Quantity
                                      </div>
                                      <div className="font-medium">
                                        {event.monitoring.qtySurvived}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">
                                        Time Since Outplanting
                                      </div>
                                      <div className="font-medium">
                                        {Math.round(
                                          (new Date(
                                            event.monitoring.date
                                          ).getTime() -
                                            new Date(event.date).getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        )}{" "}
                                        days
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Add a dropdown or accordion to view historical monitoring data */}
                                {event.monitoring.allMonitoringEvents &&
                                  event.monitoring.allMonitoringEvents.length >
                                    1 && (
                                    <div className="border rounded bg-gray-50 p-3">
                                      <div className="text-sm font-medium mb-2">
                                        Historical Monitoring Data
                                      </div>
                                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {event.monitoring.allMonitoringEvents
                                          .slice(1)
                                          .map((monEvent, idx) => (
                                            <div
                                              key={`monitoring-history-${idx}`}
                                              className="bg-white p-2 rounded border text-xs"
                                            >
                                              <div className="flex justify-between items-center mb-1">
                                                <div className="font-medium">
                                                  {new Date(
                                                    monEvent.date
                                                  ).toLocaleDateString()}
                                                </div>
                                                <div
                                                  className={`font-bold ${
                                                    monEvent.survivalRate >= 70
                                                      ? "text-green-600"
                                                      : monEvent.survivalRate >=
                                                        40
                                                      ? "text-yellow-600"
                                                      : "text-red-600"
                                                  }`}
                                                >
                                                  {monEvent.survivalRate}%
                                                  Survival
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-2 gap-1">
                                                <div>Surviving:</div>
                                                <div>
                                                  {monEvent.qtySurvived} of{" "}
                                                  {monEvent.initialQuantity}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
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
