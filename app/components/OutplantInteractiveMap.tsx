"use client";

import "mapbox-gl/dist/mapbox-gl.css"; // this took me a while to figure out!
import { useEffect, useState } from "react";
import { Map, Marker, NavigationControl, Popup } from "react-map-gl";
import { getUniqueSpecies } from "../actions/getGeneticMappings";
import { getMonitoring, MonitoringResponse } from "../actions/getMonitoring";
import { parseCoralId } from "../lib/coral";
import {
  Genetic,
  OutplantResponse,
  PopupInfoWithMultipleEvents,
} from "../types/files";
import OutplantDetailedTable from "./OutplantDetailedTable";
import { generateCSV } from "./ReportGenerator";

const mergeGenetics = (genetics: Genetic[]): Genetic[] => {
  return Object.values(
    genetics.reduce<Record<string, Genetic>>((acc, genetic) => {
      const key = genetic.uniqueGenotype || genetic.genotype;
      if (!acc[key]) {
        acc[key] = {
          genotype: genetic.genotype,
          uniqueGenotype: genetic.uniqueGenotype,
          quantity: 0,
          assessionId: genetic.assessionId,
        };
      }
      acc[key].quantity += genetic.quantity;
      return acc;
    }, {})
  );
};

export default function OutplantInteractiveMap(props: {
  outplants: OutplantResponse[];
  initialMonitoringData?: MonitoringResponse[];
}) {
  const [popupInfo, setPopupInfo] = useState<
    OutplantResponse | PopupInfoWithMultipleEvents | null
  >(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<string>("All Organizations");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("All Species");
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState<boolean>(true);
  const [monitoringData, setMonitoringData] = useState<MonitoringResponse[]>(
    props.initialMonitoringData || []
  );
  const [, setIsLoadingMonitoring] = useState<boolean>(
    props.initialMonitoringData ? false : true
  );
  const [showSurvivalData, setShowSurvivalData] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingSpecies(true);
        const shouldLoadMonitoring = !props.initialMonitoringData;
        if (shouldLoadMonitoring) {
          setIsLoadingMonitoring(true);
        }

        const uploadedSpecies = await getUniqueSpecies();

        const outplantSpecies = new Set<string>();
        props.outplants.forEach((outplant) => {
          outplant.genetics.forEach((genetic) => {
            try {
              const parsedId = parseCoralId(genetic.genotype);
              const species = genetic.species || parsedId.speciesName;
              if (
                species &&
                species !== genetic.genotype &&
                species !== "Unknown species"
              ) {
                outplantSpecies.add(species);
              }
            } catch (err) {
              console.warn(
                `Could not parse species from genotype: ${genetic.genotype}`,
                err
              );
            }
          });
        });

        const combinedSpecies = [
          ...new Set([...uploadedSpecies, ...outplantSpecies]),
        ].sort();
        setSpeciesList(["All Species", ...combinedSpecies]);

        if (shouldLoadMonitoring) {
          try {
            const monitoringResults = await getMonitoring();
            console.log(
              `Loaded ${monitoringResults.length} monitoring records`
            );
            setMonitoringData(monitoringResults);
          } catch (err) {
            console.error("Failed to load monitoring data:", err);
          } finally {
            setIsLoadingMonitoring(false);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoadingSpecies(false);
      }
    }

    loadData();
  }, [props.outplants, props.initialMonitoringData]);

  const organizations = [
    "All Organizations",
    ...new Set(props.outplants.map((o) => o.contact)),
  ];

  const getAllMonitoringEvents = (outplantId: string) => {
    return monitoringData
      .filter((m) => m.eventId === outplantId)
      .map((monitoringRecord) => {
        const survivalRate = monitoringRecord.outplantingEvent?.initialQuantity
          ? Math.round(
              (monitoringRecord.qtySurvived /
                monitoringRecord.outplantingEvent.initialQuantity) *
                100
            )
          : 0;

        return {
          id: monitoringRecord.id,
          qtySurvived: monitoringRecord.qtySurvived,
          initialQuantity:
            monitoringRecord.outplantingEvent?.initialQuantity || 0,
          survivalRate: survivalRate,
          monitoringDate: monitoringRecord.date,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.monitoringDate).getTime() -
          new Date(a.monitoringDate).getTime()
      );
  };

  const getSurvivalData = (outplantId: string) => {
    const events = getAllMonitoringEvents(outplantId);
    return events.length > 0 ? events[0] : null;
  };

  const filteredOutplants = props.outplants.filter((outplant) => {
    const outplantDate = new Date(outplant.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const dateMatch =
      start && end
        ? outplantDate >= start && outplantDate <= end
        : start
        ? outplantDate >= start
        : end
        ? outplantDate <= end
        : true;

    const orgMatch =
      selectedOrg === "All Organizations" || outplant.contact === selectedOrg;

    const speciesMatch =
      selectedSpecies === "All Species" ||
      outplant.genetics.some((genetic) => {
        if (!genetic.genotype) return false;

        try {
          const parsedId = parseCoralId(genetic.genotype);
          const species = genetic.species || parsedId.speciesName;
          return species?.toLowerCase() === selectedSpecies.toLowerCase();
        } catch (error) {
          console.error("Error parsing coral ID:", error, genetic.genotype);
          return false;
        }
      });

    return dateMatch && orgMatch && speciesMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filter Outplants</h2>
              <button
                onClick={() => generateCSV(filteredOutplants)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                >
                  {organizations.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Species
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={selectedSpecies}
                  onChange={(e) => setSelectedSpecies(e.target.value)}
                  disabled={isLoadingSpecies}
                >
                  {isLoadingSpecies ? (
                    <option>Loading species...</option>
                  ) : (
                    speciesList.map((species) => (
                      <option key={species} value={species}>
                        {species}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <input
                    id="showSurvival"
                    type="checkbox"
                    checked={showSurvivalData}
                    onChange={(e) => setShowSurvivalData(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="showSurvival"
                    className="text-sm text-gray-700"
                  >
                    Show Survival Data
                  </label>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm h-[600px] w-full">
            <Map
              mapboxAccessToken="pk.eyJ1IjoibWFkZWJ5d2VsY2giLCJhIjoiY200dmxuYnA2MDN4OTJqcTFoeHZ0eHg5dCJ9.Bof3_3ykiFWZTWdgang3Cg"
              initialViewState={{
                longitude: -81.783333,
                latitude: 24.545833,
                zoom: 12,
              }}
              style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
              mapStyle="mapbox://styles/mapbox/streets-v9"
            >
              <NavigationControl position="top-right" />
              {Object.entries(
                filteredOutplants.reduce((acc, outplant) => {
                  const coords = outplant.coordinates.trim();
                  if (!acc[coords]) {
                    acc[coords] = [];
                  }
                  acc[coords].push(outplant);
                  return acc;
                }, {} as Record<string, OutplantResponse[]>)
              ).map(([coords, outplantsAtLocation]) => {
                const [longitude, latitude] = coords.split(",").map(Number);
                const multipleEvents = outplantsAtLocation.length > 1;

                return (
                  <Marker
                    key={coords}
                    longitude={longitude}
                    latitude={latitude}
                    color={multipleEvents ? "#0066FF" : "#FF0000"}
                    scale={multipleEvents ? 1.2 : 1}
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      if (multipleEvents) {
                        const combinedInfo = {
                          ...outplantsAtLocation[0],
                          hasMultipleEvents: true,
                          allOutplants: outplantsAtLocation,
                        };
                        setPopupInfo(
                          combinedInfo as PopupInfoWithMultipleEvents
                        );
                      } else {
                        setPopupInfo(outplantsAtLocation[0]);
                      }
                    }}
                  >
                    {multipleEvents && (
                      <div className="bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-blue-500">
                        {outplantsAtLocation.length}
                      </div>
                    )}
                  </Marker>
                );
              })}

              {popupInfo && (
                <Popup
                  longitude={Number(popupInfo.coordinates.trim().split(",")[0])}
                  latitude={Number(popupInfo.coordinates.trim().split(",")[1])}
                  anchor="bottom"
                  closeOnClick={false}
                  closeButton={true}
                  onClose={() => setPopupInfo(null)}
                  maxWidth="320px"
                  offset={25}
                >
                  <div className="p-2 font-sans w-full max-w-[300px]">
                    {(popupInfo as PopupInfoWithMultipleEvents)
                      .hasMultipleEvents ? (
                      <>
                        <h3 className="text-lg font-bold text-gray-800 mb-3">
                          {popupInfo.reefName} - Multiple Outplanting Events
                        </h3>

                        <div className="max-h-[300px] overflow-y-auto">
                          {(
                            popupInfo as PopupInfoWithMultipleEvents
                          ).allOutplants.map(
                            (event: OutplantResponse, idx: number) => {
                              const monitoringEvents = showSurvivalData
                                ? getAllMonitoringEvents(event.id)
                                : [];

                              return (
                                <div
                                  key={event.id}
                                  className={`p-2 ${
                                    idx > 0
                                      ? "border-t border-gray-200 mt-3 pt-3"
                                      : ""
                                  }`}
                                >
                                  <h4 className="font-medium">
                                    {new Date(event.date).toLocaleDateString()}
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    <div>Site: {event.siteName}</div>
                                    <div>Contact: {event.contact}</div>
                                    <div>
                                      Corals:{" "}
                                      {event.genetics.reduce(
                                        (sum, g) => sum + g.quantity,
                                        0
                                      )}
                                    </div>
                                    <div>
                                      Species:{" "}
                                      {[
                                        ...new Set(
                                          event.genetics.map((g) => {
                                            const parsedId = parseCoralId(
                                              g.genotype
                                            );
                                            return (
                                              g.species || parsedId.speciesName
                                            );
                                          })
                                        ),
                                      ].join(", ")}
                                    </div>

                                    {monitoringEvents.length > 0 && (
                                      <div className="mt-2">
                                        <div className="font-medium">
                                          Monitoring Data:
                                        </div>
                                        <div className="max-h-[150px] overflow-y-auto mt-1 space-y-2">
                                          {monitoringEvents.map(
                                            (survival, mIdx) => (
                                              <div
                                                key={`survival-${event.id}-${mIdx}`}
                                                className={`p-1 rounded ${
                                                  survival.survivalRate >= 70
                                                    ? "bg-green-50"
                                                    : survival.survivalRate >=
                                                      40
                                                    ? "bg-yellow-50"
                                                    : "bg-red-50"
                                                }`}
                                              >
                                                <div className="grid grid-cols-2 text-xs gap-1">
                                                  <div>Date:</div>
                                                  <div>
                                                    {new Date(
                                                      survival.monitoringDate
                                                    ).toLocaleDateString()}
                                                  </div>
                                                  <div>Alive:</div>
                                                  <div>
                                                    {survival.qtySurvived} of{" "}
                                                    {survival.initialQuantity}
                                                  </div>
                                                  <div>Rate:</div>
                                                  <div
                                                    className={`font-bold ${
                                                      survival.survivalRate >=
                                                      70
                                                        ? "text-green-600"
                                                        : survival.survivalRate >=
                                                          40
                                                        ? "text-yellow-600"
                                                        : "text-red-600"
                                                    }`}
                                                  >
                                                    {survival.survivalRate}%
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="space-y-2">
                            <div className="grid grid-cols-[auto,1fr] gap-2 font-medium">
                              <span>Cumulative Total:</span>
                              <span className="text-right">
                                {(
                                  popupInfo as PopupInfoWithMultipleEvents
                                ).allOutplants.reduce(
                                  (sum: number, event: OutplantResponse) =>
                                    sum +
                                    event.genetics.reduce(
                                      (s, g) => s + g.quantity,
                                      0
                                    ),
                                  0
                                )}{" "}
                                corals
                              </span>
                            </div>

                            {showSurvivalData && (
                              <div className="grid grid-cols-2 gap-2 text-sm mt-2 pt-2 border-t border-gray-100">
                                <div className="font-medium">
                                  Cumulative Survival:
                                </div>
                                {(() => {
                                  let totalInitial = 0;
                                  let totalSurvived = 0;

                                  (
                                    popupInfo as PopupInfoWithMultipleEvents
                                  ).allOutplants.forEach(
                                    (event: OutplantResponse) => {
                                      const survival = getSurvivalData(
                                        event.id
                                      );
                                      if (survival) {
                                        totalInitial +=
                                          survival.initialQuantity;
                                        totalSurvived += survival.qtySurvived;
                                      }
                                    }
                                  );

                                  const cumulativeSurvivalRate =
                                    totalInitial > 0
                                      ? Math.round(
                                          (totalSurvived / totalInitial) * 100
                                        )
                                      : 0;

                                  let colorClass = "text-red-600";
                                  if (cumulativeSurvivalRate >= 70)
                                    colorClass = "text-green-600";
                                  else if (cumulativeSurvivalRate >= 40)
                                    colorClass = "text-yellow-600";

                                  return totalInitial > 0 ? (
                                    <div className={`font-bold ${colorClass}`}>
                                      {totalSurvived} of {totalInitial} corals (
                                      {cumulativeSurvivalRate}%)
                                    </div>
                                  ) : (
                                    <div className="text-gray-500">
                                      No monitoring data available
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-bold text-gray-800 mb-3 break-words">
                          {popupInfo.reefName}
                        </h3>

                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-[auto,1fr] gap-2">
                            <span className="font-medium">Site:</span>
                            <span className="text-right">
                              {popupInfo.siteName}
                            </span>
                          </div>

                          <div className="grid grid-cols-[auto,1fr] gap-2">
                            <span className="font-medium">Date:</span>
                            <span className="text-right">
                              {new Date(popupInfo.date).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-[auto,1fr] gap-2">
                            <span className="font-medium">Contact:</span>
                            <span className="text-right">
                              {popupInfo.contact}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <span className="font-medium">Genotypes:</span>
                          <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
                            {mergeGenetics(popupInfo.genetics).map(
                              (genetic) => (
                                <div
                                  key={genetic.genotype}
                                  className="grid grid-cols-[1fr,auto] items-center gap-2 text-sm py-1"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-gray-900 break-words">
                                      {genetic.species ||
                                        parseCoralId(genetic.genotype)
                                          .speciesName}
                                    </span>
                                    <span className="text-xs text-gray-500 break-all">
                                      ID: {genetic.genotype}
                                    </span>
                                  </div>
                                  <span className="whitespace-nowrap">
                                    {genetic.quantity} colonies
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-200 font-medium grid grid-cols-[auto,1fr] gap-2">
                            <span>Total:</span>
                            <span className="text-right">
                              {popupInfo.genetics.reduce(
                                (sum, g) => sum + g.quantity,
                                0
                              )}{" "}
                              corals
                            </span>
                          </div>

                          {showSurvivalData &&
                            (() => {
                              const allEvents = getAllMonitoringEvents(
                                popupInfo.id
                              );
                              if (allEvents.length === 0) return null;

                              return (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="font-medium mb-2">
                                    Monitoring Data:
                                  </div>

                                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                                    {allEvents.map((survivalEvent, idx) => (
                                      <div
                                        key={`monitoring-${popupInfo.id}-${idx}`}
                                        className={`p-2 rounded ${
                                          survivalEvent.survivalRate >= 70
                                            ? "bg-green-50"
                                            : survivalEvent.survivalRate >= 40
                                            ? "bg-yellow-50"
                                            : "bg-red-50"
                                        }`}
                                      >
                                        <div className="grid grid-cols-2 text-sm gap-1">
                                          <div>Monitoring Date:</div>
                                          <div className="font-medium">
                                            {new Date(
                                              survivalEvent.monitoringDate
                                            ).toLocaleDateString()}
                                          </div>
                                          <div>Still Alive:</div>
                                          <div>
                                            {survivalEvent.qtySurvived} of{" "}
                                            {survivalEvent.initialQuantity}
                                          </div>
                                          <div>Survival Rate:</div>
                                          <div
                                            className={`font-bold ${
                                              survivalEvent.survivalRate >= 70
                                                ? "text-green-600"
                                                : survivalEvent.survivalRate >=
                                                  40
                                                ? "text-yellow-600"
                                                : "text-red-600"
                                            }`}
                                          >
                                            {survivalEvent.survivalRate}%
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        </div>

        <OutplantDetailedTable
          outplants={filteredOutplants}
          monitoringData={monitoringData}
          showSurvivalData={showSurvivalData}
        />
      </main>
    </div>
  );
}
