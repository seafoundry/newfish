"use client";

import { Map, Marker, NavigationControl, Popup } from "react-map-gl";
import { useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css"; // this took me a while to figure out!

interface ReefLocation {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
}

const reefLocations: ReefLocation[] = [
  {
    id: 1,
    name: "Western Dry Rocks",
    longitude: -81.78494,
    latitude: 24.545886,
  },
  {
    id: 2,
    name: "Eastern Dry Rocks",
    longitude: -81.774361,
    latitude: 24.547059,
  },
  {
    id: 3,
    name: "Sand Key Reef",
    longitude: -81.793066,
    latitude: 24.53995,
  },
];

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

export default function OutplantsPage() {
  const [popupInfo, setPopupInfo] = useState<ReefLocation | null>(null);

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
              {reefLocations.map((location) => (
                <Marker
                  key={location.id}
                  longitude={location.longitude}
                  latitude={location.latitude}
                  color="#FF0000"
                  scale={1}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setPopupInfo(location);
                  }}
                />
              ))}

              {popupInfo && (
                <Popup
                  longitude={popupInfo.longitude}
                  latitude={popupInfo.latitude}
                  anchor="top"
                  onClose={() => setPopupInfo(null)}
                >
                  <div>
                    {popupInfo.name}
                    <br />({popupInfo.latitude}, {popupInfo.longitude})
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
