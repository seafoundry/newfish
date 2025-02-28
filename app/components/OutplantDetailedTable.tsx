"use client";

import { parseCoralId, splitSpeciesName } from "../lib/coral";
import { OutplantResponse } from "../types/files";
import { MonitoringResponse } from "../actions/getMonitoring";
import { useState } from "react";

export default function OutplantDetailedTable(props: {
  outplants: OutplantResponse[];
  monitoringData?: MonitoringResponse[];
  showSurvivalData?: boolean;
}) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const eventGroups = props.outplants.map((outplant) => {
    const genetics = outplant.genetics.map((genetic) => {
      let speciesInfo = { genus: "N/A", species: "N/A" };
      try {
        const fullSpeciesName = parseCoralId(genetic.genotype);
        speciesInfo = splitSpeciesName(fullSpeciesName);
      } catch {
        console.warn(`Could not parse genotype: ${genetic.genotype}`);
      }

      return {
        genus: speciesInfo.genus,
        species: speciesInfo.species,
        genotype: genetic.genotype,
        accessionNumber: genetic.assessionId,
        colonies: genetic.quantity,
      };
    });

    const monitoring = props.monitoringData?.find(
      (m) => m.eventId === outplant.id
    );
    const survivalRate =
      monitoring && monitoring.outplantingEvent?.initialQuantity
        ? Math.round(
            (monitoring.qtySurvived /
              monitoring.outplantingEvent.initialQuantity) *
              100
          )
        : null;

    return {
      id: outplant.id,
      siteName: outplant.siteName,
      reefName: outplant.reefName,
      date: outplant.date,
      organization: outplant.contact,
      totalColonies: outplant.genetics.reduce((sum, g) => sum + g.quantity, 0),
      species: [
        ...new Set(outplant.genetics.map((g) => parseCoralId(g.genotype))),
      ],
      genetics,
      monitoring: monitoring
        ? {
            date: monitoring.date,
            qtySurvived: monitoring.qtySurvived,
            initialQuantity: monitoring.outplantingEvent?.initialQuantity || 0,
            survivalRate,
          }
        : null,
    };
  });

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
                      Details
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
                                  event.monitoring.survivalRate >= 70
                                    ? "text-green-600"
                                    : event.monitoring.survivalRate &&
                                      event.monitoring.survivalRate >= 40
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {event.monitoring.qtySurvived} of{" "}
                                {event.monitoring.initialQuantity}(
                                {event.monitoring.survivalRate}%)
                              </div>
                            ) : (
                              <span className="text-gray-400">No data</span>
                            )}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
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
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                  {event.genetics.map((genetic, idx) => (
                                    <tr
                                      key={`${genetic.genotype}-${idx}`}
                                      className="text-xs"
                                    >
                                      <td className="whitespace-nowrap px-3 py-2 font-medium">
                                        {genetic.genus}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2">
                                        {genetic.species}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2 font-mono">
                                        {genetic.genotype}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2">
                                        {genetic.accessionNumber !== "None" ? (
                                          <a
                                            href={`https://www.crfcoralregistry.com/#main/3/registry/edit?id=${genetic.accessionNumber}`}
                                            className="text-blue-500"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            {genetic.accessionNumber}
                                          </a>
                                        ) : (
                                          genetic.accessionNumber
                                        )}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2">
                                        {genetic.colonies}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {props.showSurvivalData && event.monitoring && (
                              <div className="mt-4 p-3 border rounded bg-white">
                                <h4 className="text-sm font-medium mb-2">
                                  Monitoring Data
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 text-xs gap-3">
                                  <div>
                                    <div className="text-gray-500">
                                      Monitoring Date
                                    </div>
                                    <div className="font-medium">
                                      {new Date(
                                        event.monitoring.date
                                      ).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">
                                      Initial Quantity
                                    </div>
                                    <div className="font-medium">
                                      {event.monitoring.initialQuantity}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">
                                      Qty Survived
                                    </div>
                                    <div className="font-medium">
                                      {event.monitoring.qtySurvived}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">
                                      Survival Rate
                                    </div>
                                    <div
                                      className={`font-medium ${
                                        event.monitoring.survivalRate &&
                                        event.monitoring.survivalRate >= 70
                                          ? "text-green-600"
                                          : event.monitoring.survivalRate &&
                                            event.monitoring.survivalRate >= 40
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {event.monitoring.survivalRate}%
                                    </div>
                                  </div>
                                </div>
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
