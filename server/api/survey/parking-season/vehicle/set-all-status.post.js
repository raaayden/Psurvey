export default defineEventHandler(async (event) => {
  try {
    const { status } = await readBody(event);

    if (!status) {
      return {
        statusCode: 400,
        message: "Invalid Request",
      };
    }

    const updateVehicleSeasonParking = await prisma.parking_season.updateMany({
      where: {
        season_status: status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      },
      data: {
        season_status: status,
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
