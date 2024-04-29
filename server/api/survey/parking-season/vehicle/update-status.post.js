export default defineEventHandler(async (event) => {
  try {
    const { seasonId, status } = await readBody(event);

    if (!seasonId || !status) {
      return {
        statusCode: 400,
        message: "Invalid Request",
      };
    }

    console.log("seasonId: ", seasonId);
    console.log("status: ", status);

    const updateVehicleSeasonParking = await prisma.parking_season.update({
      where: {
        season_id: seasonId,
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
