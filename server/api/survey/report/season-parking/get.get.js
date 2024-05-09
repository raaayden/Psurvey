import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const { projectName, date } = getQuery(event);

    if (!projectName) {
      return {
        statusCode: 400,
        message: "Bad Request",
      };
    }

    // Check valid project name
    const project = await prisma.project.findFirst({
      where: {
        project_name: projectName,
      },
      select: {
        project_id: true,
      },
    });

    if (!project) {
      return {
        statusCode: 404,
        message: "Project name does not exist",
      };
    }

    const dateOfReport = DateTime.now().toFormat("dd/MM/yyyy");

    const getSurveyList = await prisma.survey_list.findMany({
      where: {
        project_id: project.project_id,
        // vehicle_timein: {
        //   gte: date ? DateTime.fromISO(date) : undefined,
        //   lte: date ? DateTime.fromISO(date).endOf("day") : undefined,
        // },
      },
      select: {
        survey_list_id: true,
        vehicle: {
          select: {
            vehicle_plate_number: true,
          },
        },
        vehicle_timein: true,
      },
      orderBy: {
        vehicle: {
          vehicle_plate_number: "asc",
        },
      },
    });

    console.log("getSurveyList: ", getSurveyList);

    let data = [];
    for (let i = 0; i < getSurveyList.length; i++) {
      const survey = getSurveyList[i];

      const getSeasonParkingPlate = await prisma.parking_season.findFirst({
        where: {
          season_status: "ACTIVE",
          vehicle: {
            vehicle_plate_number: survey.vehicle.vehicle_plate_number,
          },
        },
        select: {
          vehicle: {
            select: {
              vehicle_plate_number: true,
            },
          },
        },
      });

      if (getSeasonParkingPlate) {
        // Check if vehicle is already in the list using vehicle_plate_number find
        const vehicle = data.find(
          (item) => item.vehicleNo === survey.vehicle.vehicle_plate_number
        );

        if (!vehicle) {
          data.push({
            vehicleNo: survey.vehicle.vehicle_plate_number,
          });
        }
      }
    }

    console.log("data: ", data);

    return {
      statusCode: 200,
      message: "OK",
      data: {
        projectName,
        dateOfReport,
        date,
        seasonParkingList: data,
        totalVehicle: data.length || 0,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
