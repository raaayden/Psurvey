import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const { vehicle } = await readBody(event);

    if (!vehicle) {
      return {
        statusCode: 400,
        message: "Invalid Request",
      };
    }

    console.log("vehicle: ", vehicle);

    for (let i = 0; i < vehicle.length; i++) {
      const vh = vehicle[i];

      const insertVehicleSeasonParking = await prisma.parking_season.create({
        data: {
          vehicle: {
            connectOrCreate: {
              where: {
                vehicle_plate_number: vh,
              },
              create: {
                vehicle_plate_number: vh,
                created_by: "SYSTEM",
                created_at: DateTime.now(),
              },
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
