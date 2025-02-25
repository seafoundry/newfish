"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    const outplantingEventsMap = new Map(
      outplantingFiles.map((event) => [
        event.id,
        {
          siteName: event.siteName,
          reefName: event.reefName,
          eventName: event.eventName,
          date: event.date,
          initialQuantity: event.rows.reduce(
            (sum, row) => sum + row.quantity,
            0
          ),
        },
      ])
    );

    const eventGroups = new Map<
      string,
      {
        files: typeof monitoringFiles;
        maxQty: number;
        latestDate: string;
      }
    >();

    for (const file of monitoringFiles) {
      const eventId = file.eventId;

      let totalQtySurvived = 0;
      for (const row of file.rows) {
        const qtyValue = Number(row.QtySurvived);
        if (!isNaN(qtyValue)) {
          totalQtySurvived += qtyValue;
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

        const responseObj: MonitoringResponse = {
          id: bestFile.id,
          fileUploadId: bestFile.fileUploadId,
          date: bestFile.date,
          coordinates: bestFile.coordinates,
          eventId: bestFile.eventId,
          qtySurvived: highestQty,
          additionalData:
            (bestFile.rows[0]?.additionalData as Record<string, unknown>) || {},
          outplantingEvent: outplantingEvent,
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
