"use server";

import { getMonitoring } from "@/app/actions/getMonitoring";
import getOutplants from "@/app/actions/getOutplants";
import OutplantInteractiveMap from "@/app/components/OutplantInteractiveMap";

export default async function Outplants() {
  const outplants = await getOutplants();
  const monitoringData = await getMonitoring();

  return (
    <OutplantInteractiveMap
      outplants={outplants}
      initialMonitoringData={monitoringData}
    />
  );
}
