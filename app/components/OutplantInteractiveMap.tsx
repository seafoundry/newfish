"use client";

import "mapbox-gl/dist/mapbox-gl.css"; // this took me a while to figure out!
import { useState } from "react";
import { Map, Marker, NavigationControl, Popup } from "react-map-gl";
import { listAllSpecies, parseCoralId } from "../lib/coral";
import { Genetic, OutplantResponse } from "../types/files";

const mergeGenetics = (genetics: Genetic[]): Genetic[] => {
  return Object.values(
    genetics.reduce<Record<string, Genetic>>((acc, { genotype, quantity }) => {
      if (!acc[genotype]) {
        acc[genotype] = { genotype, quantity: 0 };
      }
      acc[genotype].quantity += quantity;
      return acc;
    }, {})
  );
};

const species = ["All Species", ...listAllSpecies()];

export default function OutplantInteractiveMap(props: {
  outplants: OutplantResponse[];
}) {
  const [popupInfo, setPopupInfo] = useState<OutplantResponse | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<string>("All Organizations");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("All Species");

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
            <h2 className="text-lg font-semibold mb-4">Filter Outplants</h2>
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
                >
                  {species.map((species) => (
                    <option key={species} value={species}>
                      {species}
                    </option>
                  ))}
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
                  anchor="top"
                  onClose={() => setPopupInfo(null)}
                  style={{ maxWidth: "400px" }}
                >
                  <div className="p-4 font-sans" style={{ width: "320px" }}>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      {popupInfo.reefName}
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Site:</span>
                        <span>{popupInfo.siteName}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-medium">Date:</span>
                        <span>
                          {new Date(popupInfo.date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-medium">Contact:</span>
                        <span>{popupInfo.contact}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="font-medium">Genotypes:</span>
                      <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
                        {mergeGenetics(popupInfo.genetics).map((genetic) => (
                          <div
                            key={genetic.genotype}
                            className="flex items-center justify-between text-sm py-1"
                          >
                            <div className="flex flex-col">
                              <span className="text-gray-900">
                                {parseCoralId(genetic.genotype)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ID: {genetic.genotype}
                              </span>
                            </div>
                            <span className="ml-2 whitespace-nowrap">
                              {genetic.quantity} colonies
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 font-medium flex justify-between">
                        <span>Total:</span>
                        <span>
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
      </main>
    </div>
  );
}
