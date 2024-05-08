import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const deleteAllParkingSeason = await prisma.parking_season.updateMany({
      data: {
        season_status: "DELETED",
        updated_by: "SYSTEM",
        updated_at: DateTime.now(),
      },
    });

    if (!deleteAllParkingSeason) {
      return {
        statusCode: 500,
        message: "Internal Server Error",
      };
    }

    return {
      statusCode: 200,
      message: "Success delete all Parking Season Rule",
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
