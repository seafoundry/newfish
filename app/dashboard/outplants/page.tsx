"use server";

import getOutplants from "@/app/actions/getOutplants";
import OutplantInteractiveMap from "@/app/components/OutplantInteractiveMap";

export default async function Outplants() {
  const outplants = await getOutplants();

  return <OutplantInteractiveMap outplants={outplants} />;
}
