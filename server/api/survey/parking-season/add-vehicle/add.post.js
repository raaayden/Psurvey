import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const { projectID, vehicleList } = await readBody(event);

    if (!projectID && !vehicleList) {
      return {
        statusCode: 400,
        message: "Invalid Request",
      };
    }

    console.log("vehicleList: ", vehicleList);

    for (let i = 0; i < vehicleList.length; i++) {
      const vh = vehicleList[i];

      // Select if vehicle already exist, update status to ACTIVE
      const checkVehicle = await prisma.parking_season.findFirst({
        where: {
          vehicle: {
            vehicle_plate_number: parseInt(vh),
          },
          project_id: projectID,
        },
      });

      console.log("checkVehicle: ", checkVehicle);

      // If vehicle exist, update status to ACTIVE
      if (checkVehicle) {
        // Update vehicle status to ACTIVE
        const updateVehicleSeasonParking = await prisma.parking_season.update({
          where: {
            season_id: checkVehicle.season_id,
          },
          data: {
            season_status: "ACTIVE",
            updated_by: "SYSTEM",
            updated_at: DateTime.now(),
          },
        });

        console.log("updateVehicleSeasonParking: ", updateVehicleSeasonParking);

        if (!updateVehicleSeasonParking) {
          return {
            statusCode: 500,
            message: "Internal Server Error",
          };
        }
      } else {
        // If vehicle not exist, insert new vehicle
        const insertVehicleSeasonParking = await prisma.parking_season.create({
          data: {
            vehicle: {
              connectOrCreate: {
                where: {
                  vehicle_plate_number: parseInt(vh),
                },
                create: {
                  vehicle_plate_number: parseInt(vh),
                  created_by: "SYSTEM",
                  created_at: DateTime.now(),
                },
              },
            },
            project: {
              connect: {
                project_id: projectID,
              },
            },
            season_status: "ACTIVE",
            created_by: "SYSTEM",
            created_at: DateTime.now(),
          },
        });

        console.log("insertVehicleSeasonParking: ", insertVehicleSeasonParking);

        if (!insertVehicleSeasonParking) {
          return {
            statusCode: 500,
            message: "Internal Server Error",
          };
        }
      }
    }

    return {
      statusCode: 200,
      message: "Success add Parking Season Rule",
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
