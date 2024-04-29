export default defineEventHandler(async (event) => {
  try {
    const updateVehicleSeasonParking = await prisma.parking_season.updateMany({
      where: {
        season_status: "ACTIVE",
      },
      data: {
        season_status: "INACTIVE",
      },
    });

    console.log("updateVehicleSeasonParking: ", updateVehicleSeasonParking);

    if (!updateVehicleSeasonParking) {
      return {
        statusCode: 500,
        message: "Internal Server Error",
      };
    }

    return {
      statusCode: 200,
      message: "Success update Parking Season Rule",
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
