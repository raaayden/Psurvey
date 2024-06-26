export default defineEventHandler(async (event) => {
  try {
    const { projectID } = getQuery(event);

    const getAvailableVehicle = await prisma.survey_list.findMany({
      where: {
        project_id: parseInt(projectID),
      },
      select: {
        vehicle: {
          select: {
            vehicle_id: true,
            vehicle_plate_number: true,
          },
        },
      },
      distinct: ["vehicle_id"],
    });

    console.log("getAvailableVehicle: ", getAvailableVehicle);

    // const getAvailableVehicle = await prisma.vehicle.findMany({
    //   select: {
    //     vehicle_id: true,
    //     vehicle_plate_number: true,
    //   },
    // });

    if (!getAvailableVehicle || getAvailableVehicle.length === 0) {
      return {
        statusCode: 404,
        message: "Vehicle not found",
      };
    }

    // Check if the vehicle already exist in season parking
    const getVehicleSeasonParking = await prisma.parking_season.findMany({
      where: {
        season_status: "ACTIVE",
        project_id: parseInt(projectID),
        vehicle_id: {
          in: getAvailableVehicle.map((v) => v.vehicle.vehicle_id),
        },
      },
    });

    // If exist remove the vehicle from available vehicle
    const remapAvailableVehicle = getAvailableVehicle.filter(
      (v) =>
        !getVehicleSeasonParking.some(
          (seasonParking) => seasonParking.vehicle_id === v.vehicle.vehicle_id
        )
    );

    // Remap the vehicle to be used in the frontend
    const remapOptionVehicle = remapAvailableVehicle.map(
      (v) => v.vehicle.vehicle_plate_number
    );

    // Sort the vehicle
    remapOptionVehicle.sort();

    return {
      statusCode: 200,
      message: "Success get Vehicle List",
      data: remapOptionVehicle,
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
