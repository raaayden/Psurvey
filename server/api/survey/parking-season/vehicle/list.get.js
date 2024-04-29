export default defineEventHandler(async (event) => {
  try {
    const getAvailableVehicle = await prisma.vehicle.findMany({
      select: {
        vehicle_id: true,
        vehicle_plate_number: true,
      },
    });

    if (!getAvailableVehicle || getAvailableVehicle.length === 0) {
      return {
        statusCode: 404,
        message: "Vehicle not found",
      };
    }

    // Check if the vehicle already exist in season parking
    const getVehicleSeasonParking = await prisma.parking_season.findMany({
      where: {
        vehicle_id: {
          in: getAvailableVehicle.map((vehicle) => vehicle.vehicle_id),
        },
      },
    });

    // If exist remove the vehicle from available vehicle
    const remapAvailableVehicle = getAvailableVehicle.filter(
      (vehicle) =>
        !getVehicleSeasonParking.some(
          (seasonParking) => seasonParking.vehicle_id === vehicle.vehicle_id
        )
    );

    // Remap the vehicle to be used in the frontend
    const remapOptionVehicle = remapAvailableVehicle.map(
      (vehicle) => vehicle.vehicle_plate_number
    );

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
