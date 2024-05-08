export default defineEventHandler(async (event) => {
  try {
    const { projectID } = getQuery(event);

    const getParkingList = await prisma.parking_season.findMany({
      where: {
        project_id: projectID ? parseInt(projectID) : undefined,
        season_status: {
          not: "DELETED",
        },
      },
      select: {
        season_id: true,
        project: {
          select: {
            project_name: true,
          },
        },
        vehicle: {
          select: {
            vehicle_plate_number: true,
          },
        },
        season_status: true,
      },
    });

    if (!getParkingList || getParkingList.length === 0) {
      return {
        statusCode: 404,
        message: "Parking Season Vehicle not found",
      };
    }

    const remapParkingList = getParkingList.map((parking) => {
      return {
        projectName: parking?.project?.project_name,
        carPlateNumber: parking?.vehicle?.vehicle_plate_number,
        action: {
          id: parking?.season_id,
          status: parking?.season_status,
        },
      };
    });

    return {
      statusCode: 200,
      message: "Success get Parking Season Vehicle List",
      data: {
        parkingSeasonList: remapParkingList,
        isAllInactive: false,
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
