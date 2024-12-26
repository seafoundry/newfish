"use client";

import "mapbox-gl/dist/mapbox-gl.css"; // this took me a while to figure out!
import { useState } from "react";
import { Map, Marker, NavigationControl, Popup } from "react-map-gl";
import parseCoralId from "../lib/coral";
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

const organizations = [
  "All Organizations",
  "Mote Marine Laboratory",
  "Coral Restoration Foundation",
  "Florida Keys National Marine Sanctuary",
];

const species = [
  "All Species",
  "Acropora cervicornis",
  "Acropora palmata",
  "Orbicella faveolata",
];

export default function OutplantInteractiveMap(props: {
  outplants: OutplantResponse[];
}) {
  const [popupInfo, setPopupInfo] = useState<OutplantResponse | null>(null);

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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
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
                <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
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
              {props.outplants.map((outplant) => (
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
                  style={{ maxWidth: "400px" }} // Make popup wider
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
