import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const { parkingSeasonID } = await readBody(event);

    if (!parkingSeasonID) {
      return {
        statusCode: 400,
        message: "Bad Request",
      };
    }

    const deleteParkingSeason = await prisma.parking_season.update({
      where: {
        season_id: parseInt(parkingSeasonID),
      },
      data: {
        season_status: "DELETED",
        updated_by: "SYSTEM",
        updated_at: DateTime.now(),
      },
    });

    console.log("deleteParkingSeason: ", deleteParkingSeason);

    if (!deleteParkingSeason) {
      return {
        statusCode: 500,
        message: "Internal Server Error",
      };
    }

    return {
      statusCode: 200,
      message: "Success delete Parking Season Vehicle",
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
