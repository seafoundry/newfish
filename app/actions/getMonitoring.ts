"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SurvivalDetail {
  survived: number;
  initial: number;
  rate: number;
}

export interface LocalIdSurvival extends SurvivalDetail {
  tags: string[];
}

export interface SurvivalDetails {
  byTag?: Record<string, SurvivalDetail>;
  byLocalId?: Record<string, LocalIdSurvival>;
  bySpecies?: Record<string, SurvivalDetail>;
  overall: SurvivalDetail;
}

export interface MonitoringResponse {
  id: string;
  fileUploadId: string;
  date: string;
  coordinates: string;
  eventId: string;
  qtySurvived: number;
  additionalData: Record<string, unknown>;
  outplantingEvent?: {
    siteName: string;
    reefName: string;
    eventName: string;
    date: string;
    initialQuantity: number;
    geneticIds?: string[];
    survivalDetails?: SurvivalDetails;
  };
}

export async function getMonitoring(): Promise<MonitoringResponse[]> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findFirst({
      where: { clerkUserId: clerkUser.id },
      select: {
        id: true,
        email: true,
        godMode: true,
      },
    });

    if (!user) throw new Error("User not found");

    const monitoringFiles = await prisma.monitoringFile.findMany({
      where: user.godMode
        ? {}
        : {
            fileUpload: {
              userId: user.id,
            },
          },
      include: {
        rows: true,
        fileUpload: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log(
      `[INFO] Found ${monitoringFiles.length} total monitoring files in database`
    );
    console.log(`[INFO] User godMode: ${user.godMode}`);
    console.log(`[INFO] User email: ${user.email}`);

    monitoringFiles.forEach((file) => {
      console.log(`[DEBUG] Found monitoring file: ${file.id}`);
      console.log(`  - Event ID: ${file.eventId}`);
      console.log(`  - Date: ${file.date}`);
      console.log(`  - Owner: ${file.fileUpload?.user?.email || "unknown"}`);
      console.log(`  - Row count: ${file.rows.length}`);
      console.log(
        `  - Qty values: ${file.rows.map((r) => r.QtySurvived).join(", ")}`
      );
    });

    const outplantingFiles = await prisma.outplantingFile.findMany({
      where: {
        id: { in: monitoringFiles.map((file) => file.eventId) },
      },
      include: {
        rows: true,
      },
    });

    const geneticsRows = await prisma.geneticsRow.findMany({
      where: user.godMode
        ? {}
        : {
            geneticsFile: {
              email: user.email,
            },
          },
      select: {
        localIdGenetProp: true,
        accessionNumber: true,
        species: true,
      },
    });

    const geneticsMap = new Map();
    geneticsRows.forEach((row) => {
      geneticsMap.set(row.localIdGenetProp, {
        accessionNumber: row.accessionNumber,
        species: row.species,
      });
    });

    const outplantingEventsMap = new Map();

    outplantingFiles.forEach((event) => {
      const rowsByLocalId = new Map();
      const rowsByTag = new Map();
      const rowsBySpecies = new Map();

      let totalQuantity = 0;

      event.rows.forEach((row) => {
        totalQuantity += row.quantity;

        rowsByTag.set(row.genetId, {
          quantity: row.quantity,
          grouping: row.grouping,
        });

        const localId = row.genetId.split("-")[0];
        if (localId) {
          if (!rowsByLocalId.has(localId)) {
            rowsByLocalId.set(localId, {
              quantity: row.quantity,
              tags: [row.genetId],
            });
          } else {
            const existing = rowsByLocalId.get(localId);
            existing.quantity += row.quantity;
            if (!existing.tags.includes(row.genetId)) {
              existing.tags.push(row.genetId);
            }
          }
        }

        let species = null;
        try {
          const geneticData = geneticsMap.get(row.genetId);
          if (geneticData && geneticData.species) {
            species = geneticData.species;
          } else {
            const potentialSpeciesCode = row.genetId.substring(0, 4);
            species = potentialSpeciesCode;
          }

          if (species) {
            if (!rowsBySpecies.has(species)) {
              rowsBySpecies.set(species, {
                quantity: row.quantity,
                tags: [row.genetId],
              });
            } else {
              const existing = rowsBySpecies.get(species);
              existing.quantity += row.quantity;
              if (!existing.tags.includes(row.genetId)) {
                existing.tags.push(row.genetId);
              }
            }
          }
        } catch {
          console.warn(`Could not determine species for ${row.genetId}`);
        }
      });

      outplantingEventsMap.set(event.id, {
        siteName: event.siteName,
        reefName: event.reefName,
        eventName: event.eventName,
        date: event.date,
        initialQuantity: totalQuantity,
        byTag: Object.fromEntries(rowsByTag),
        byLocalId: Object.fromEntries(rowsByLocalId),
        bySpecies: Object.fromEntries(rowsBySpecies),
        geneticIds: event.rows.map((row) => row.genetId),
      });
    });

    const eventGroups = new Map<
      string,
      {
        files: typeof monitoringFiles;
        maxQty: number;
        latestDate: string;
        tagData: Map<string, number>;
      }
    >();

    for (const file of monitoringFiles) {
      const eventId = file.eventId;

      let totalQtySurvived = 0;
      const tagDataMap = new Map<string, number>();

      for (const row of file.rows) {
        const qtyValue = Number(row.QtySurvived);
        if (!isNaN(qtyValue)) {
          totalQtySurvived += qtyValue;
        }

        try {
          const additionalData = row.additionalData as Record<string, unknown>;

          if (
            additionalData.tag ||
            additionalData.Tag ||
            additionalData.geneticId ||
            additionalData.genetId
          ) {
            const tag = (additionalData.tag ||
              additionalData.Tag ||
              additionalData.geneticId ||
              additionalData.genetId) as string;
            if (tag && qtyValue) {
              tagDataMap.set(tag, (tagDataMap.get(tag) || 0) + qtyValue);
            }
          }

          if (additionalData.localId || additionalData.LocalId) {
            const localId = (additionalData.localId ||
              additionalData.LocalId) as string;
            if (localId && qtyValue) {
              tagDataMap.set(
                `local:${localId}`,
                (tagDataMap.get(`local:${localId}`) || 0) + qtyValue
              );
            }
          }
        } catch (e) {
          console.warn(
            `Error processing additional data in monitoring row: ${e}`
          );
        }
      }

      console.log(
        `File ${file.id} for event ${eventId} has totalQty=${totalQtySurvived}`
      );

      if (!eventGroups.has(eventId)) {
        eventGroups.set(eventId, {
          files: [file],
          maxQty: totalQtySurvived,
          latestDate: file.date,
          tagData: tagDataMap,
        });
      } else {
        const group = eventGroups.get(eventId)!;
        group.files.push(file);

        if (totalQtySurvived > group.maxQty) {
          group.maxQty = totalQtySurvived;
        }

        if (new Date(file.date) > new Date(group.latestDate)) {
          group.latestDate = file.date;
        }

        tagDataMap.forEach((qty, tag) => {
          group.tagData.set(tag, (group.tagData.get(tag) || 0) + qty);
        });
      }
    }

    console.log(
      `Grouped ${monitoringFiles.length} files into ${eventGroups.size} event groups`
    );

    const monitoringData: MonitoringResponse[] = [];

    for (const [eventId, group] of eventGroups.entries()) {
      const outplantingEvent = outplantingEventsMap.get(eventId);

      if (outplantingEvent) {
        let bestFile = group.files[0];
        let highestQty = 0;

        for (const file of group.files) {
          const totalQty = file.rows.reduce(
            (sum, row) => sum + Number(row.QtySurvived || 0),
            0
          );
          if (totalQty > highestQty) {
            highestQty = totalQty;
            bestFile = file;
          }
        }

        console.log(
          `Using best file ${bestFile.id} with ${highestQty} for event ${eventId}`
        );

        const survivalDetails: SurvivalDetails = {
          byTag: {},
          byLocalId: {},
          bySpecies: {},
          overall: {
            survived: highestQty,
            initial: outplantingEvent.initialQuantity,
            rate: 0,
          },
        };

        if (outplantingEvent.initialQuantity > 0) {
          survivalDetails.overall.rate = Math.round(
            (highestQty / outplantingEvent.initialQuantity) * 100
          );
        }

        if (group.tagData && group.tagData.size > 0) {
          group.tagData.forEach((survived, tagOrLocalId) => {
            if (tagOrLocalId.startsWith("local:")) {
              const localId = tagOrLocalId.substring(6);

              if (
                outplantingEvent.byLocalId &&
                outplantingEvent.byLocalId[localId]
              ) {
                const initialQty = outplantingEvent.byLocalId[localId].quantity;
                const tags = outplantingEvent.byLocalId[localId].tags || [];

                survivalDetails.byLocalId![localId] = {
                  survived,
                  initial: initialQty,
                  rate:
                    initialQty > 0
                      ? Math.round((survived / initialQty) * 100)
                      : 0,
                  tags,
                };
              }
            } else {
              const tag = tagOrLocalId;

              if (outplantingEvent.byTag && outplantingEvent.byTag[tag]) {
                const initialQty = outplantingEvent.byTag[tag].quantity;

                survivalDetails.byTag![tag] = {
                  survived,
                  initial: initialQty,
                  rate:
                    initialQty > 0
                      ? Math.round((survived / initialQty) * 100)
                      : 0,
                };

                const localId = tag.split("-")[0];
                if (localId && !survivalDetails.byLocalId![localId]) {
                  const localIdInitialQty =
                    outplantingEvent.byLocalId[localId]?.quantity || 0;
                  survivalDetails.byLocalId![localId] = {
                    survived,
                    initial: localIdInitialQty,
                    rate:
                      localIdInitialQty > 0
                        ? Math.round((survived / localIdInitialQty) * 100)
                        : 0,
                    tags: outplantingEvent.byLocalId[localId]?.tags || [tag],
                  };
                } else if (localId) {
                  survivalDetails.byLocalId![localId].survived += survived;
                  if (survivalDetails.byLocalId![localId].initial > 0) {
                    survivalDetails.byLocalId![localId].rate = Math.round(
                      (survivalDetails.byLocalId![localId].survived /
                        survivalDetails.byLocalId![localId].initial) *
                        100
                    );
                  }
                }
              }
            }
          });
        } else {
          if (outplantingEvent.byLocalId) {
            Object.entries(outplantingEvent.byLocalId).forEach(
              ([localId, data]) => {
                const localIdData = data as {
                  quantity: number;
                  tags?: string[];
                };
                const initialQty = localIdData.quantity;
                const proportionalSurvival = Math.round(
                  (initialQty / outplantingEvent.initialQuantity) * highestQty
                );

                survivalDetails.byLocalId![localId] = {
                  survived: proportionalSurvival,
                  initial: initialQty,
                  rate:
                    initialQty > 0
                      ? Math.round((proportionalSurvival / initialQty) * 100)
                      : 0,
                  tags: localIdData.tags || [],
                };
              }
            );
          }

          if (outplantingEvent.byTag) {
            Object.entries(outplantingEvent.byTag).forEach(([tag, data]) => {
              const tagData = data as { quantity: number };
              const initialQty = tagData.quantity;
              const proportionalSurvival = Math.round(
                (initialQty / outplantingEvent.initialQuantity) * highestQty
              );

              survivalDetails.byTag![tag] = {
                survived: proportionalSurvival,
                initial: initialQty,
                rate:
                  initialQty > 0
                    ? Math.round((proportionalSurvival / initialQty) * 100)
                    : 0,
              };
            });
          }
        }

        const responseObj: MonitoringResponse = {
          id: bestFile.id,
          fileUploadId: bestFile.fileUploadId,
          date: bestFile.date,
          coordinates: bestFile.coordinates,
          eventId: bestFile.eventId,
          qtySurvived: highestQty,
          additionalData:
            (bestFile.rows[0]?.additionalData as Record<string, unknown>) || {},
          outplantingEvent: {
            siteName: outplantingEvent.siteName,
            reefName: outplantingEvent.reefName,
            eventName: outplantingEvent.eventName,
            date: outplantingEvent.date,
            initialQuantity: outplantingEvent.initialQuantity,
            geneticIds: outplantingEvent.geneticIds,
            survivalDetails,
          },
        };

        console.log(
          `Final qtySurvived for event ${eventId}: ${responseObj.qtySurvived}`
        );

        console.log(
          `Created response: id=${responseObj.id}, qtySurvived=${responseObj.qtySurvived}`
        );
        monitoringData.push(responseObj);
      }
    }

    return monitoringData;
  } catch (error) {
    console.error("Error fetching monitoring data:", error);
    throw error;
  }
}
