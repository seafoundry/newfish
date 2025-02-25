"use client";

import "mapbox-gl/dist/mapbox-gl.css"; // this took me a while to figure out!
import { useEffect, useState } from "react";
import { Map, Marker, NavigationControl, Popup } from "react-map-gl";
import { parseCoralId } from "../lib/coral";
import { Genetic, OutplantResponse } from "../types/files";
import OutplantDetailedTable from "./OutplantDetailedTable";
import { generateCSV } from "./ReportGenerator";
import { getUniqueSpecies } from "../actions/getGeneticMappings";

const mergeGenetics = (genetics: Genetic[]): Genetic[] => {
  return Object.values(
    genetics.reduce<Record<string, Genetic>>(
      (acc, { genotype, quantity, assessionId }) => {
        if (!acc[genotype]) {
          acc[genotype] = { genotype, quantity: 0, assessionId };
        }
        acc[genotype].quantity += quantity;
        return acc;
      },
      {}
    )
  );
};

export default function OutplantInteractiveMap(props: {
  outplants: OutplantResponse[];
}) {
  const [popupInfo, setPopupInfo] = useState<OutplantResponse | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<string>("All Organizations");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("All Species");
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState<boolean>(true);

  useEffect(() => {
    async function loadSpecies() {
      try {
        setIsLoadingSpecies(true);
        const uploadedSpecies = await getUniqueSpecies();

        const outplantSpecies = new Set<string>();
        props.outplants.forEach((outplant) => {
          outplant.genetics.forEach((genetic) => {
            try {
              const species = parseCoralId(genetic.genotype);
              if (species && species !== genetic.genotype) {
                outplantSpecies.add(species);
              }
            } catch {}
          });
        });

        const combinedSpecies = [
          ...new Set([...uploadedSpecies, ...outplantSpecies]),
        ].sort();
        setSpeciesList(["All Species", ...combinedSpecies]);
      } catch (error) {
        console.error("Failed to load species:", error);
      } finally {
        setIsLoadingSpecies(false);
      }
    }

    loadSpecies();
  }, [props.outplants]);

  const organizations = [
    "All Organizations",
    ...new Set(props.outplants.map((o) => o.contact)),
  ];

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
        try {
          const species = parseCoralId(genetic.genotype);
          return species === selectedSpecies;
        } catch {
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
            <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {filteredOutplants.map((outplant) => (
                <Marker
                  key={outplant.id}
                  longitude={Number(outplant.coordinates.trim().split(",")[0])}
                  latitude={Number(outplant.coordinates.trim().split(",")[1])}
                  color="#FF0000"
                  scale={1}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setPopupInfo(outplant);
                  }}
                />
              ))}

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
                    <h3 className="text-lg font-bold text-gray-800 mb-3 break-words">
                      {popupInfo.reefName}
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-[auto,1fr] gap-2">
                        <span className="font-medium">Site:</span>
                        <span className="text-right">{popupInfo.siteName}</span>
                      </div>

                      <div className="grid grid-cols-[auto,1fr] gap-2">
                        <span className="font-medium">Date:</span>
                        <span className="text-right">
                          {new Date(popupInfo.date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-[auto,1fr] gap-2">
                        <span className="font-medium">Contact:</span>
                        <span className="text-right">{popupInfo.contact}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="font-medium">Genotypes:</span>
                      <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
                        {mergeGenetics(popupInfo.genetics).map((genetic) => (
                          <div
                            key={genetic.genotype}
                            className="grid grid-cols-[1fr,auto] items-center gap-2 text-sm py-1"
                          >
                            <div className="flex flex-col">
                              <span className="text-gray-900 break-words">
                                {parseCoralId(genetic.genotype)}
                              </span>
                              <span className="text-xs text-gray-500 break-all">
                                ID: {genetic.genotype}
                              </span>
                            </div>
                            <span className="whitespace-nowrap">
                              {genetic.quantity} colonies
                            </span>
                          </div>
                        ))}
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
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        </div>

        <OutplantDetailedTable outplants={filteredOutplants} />
      </main>
    </div>
  );
}
