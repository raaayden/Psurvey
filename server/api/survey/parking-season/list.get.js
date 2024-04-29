export default defineEventHandler(async (event) => {
  try {
    const getParkingList = await prisma.parking_season.findMany({
      select: {
        season_id: true,
        vehicle: {
          select: {
            vehicle_plate_number: true,
          },
        },
        season_status: true,
        created_at: true,
      },
    });

    if (!getParkingList || getParkingList.length === 0) {
      return {
        statusCode: 404,
        message: "Parking Season not found",
      };
    }

    const remapParkingList = getParkingList.map((parking) => {
      return {
        carPlateNumber: parking.vehicle.vehicle_plate_number,
        status: {
          status: parking.season_status,
          id: parking.season_id,
        },
        createdAt: parking.created_at,
      };
    });

    // Check whether all the parking season is inactive
    const isAllInactive = remapParkingList.every(
      (parking) => parking.status.status === "INACTIVE"
    );

    return {
      statusCode: 200,
      message: "Success get Parking Season List",
      data: {
        parkingSeasonList: remapParkingList,
        isAllInactive,
      },
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
