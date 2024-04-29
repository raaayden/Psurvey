import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const { id } = getQuery(event);

    if (!id) {
      return {
        statusCode: 400,
        message: "Invalid request",
      };
    }

    const getSurveyList = await prisma.survey_list.findMany({
      where: {
        file_id: parseInt(id),
      },
      select: {
        vehicle: {
          select: {
            vehicle_plate_number: true,
          },
        },
        project_name: true,
        vehicle_timein: true,
        vehicle_timeout: true,
        project_eecode: true,
        project_parker_type: true,
        project_surveyor_name: true,
      },
    });

    if (!getSurveyList || getSurveyList.length === 0) {
      return {
        statusCode: 404,
        message: "Survey List not found",
      };
    }

    const remapSurveyList = getSurveyList.map((survey) => {
      return {
        carPlateNumber: survey.vehicle.vehicle_plate_number,
        project: survey.project_name,
        timeIn: survey.vehicle_timein
          ? DateTime.fromJSDate(survey.vehicle_timein).toFormat(
              "yyyy-MM-dd hh:mm:ss"
            )
          : null,
        timeOut: survey.vehicle_timeout
          ? DateTime.fromJSDate(survey.vehicle_timeout).toFormat(
              "yyyy-MM-dd hh:mm:ss"
            )
          : null,
        entryExitCode: survey.project_eecode,
        parkerType: survey.project_parker_type,
        surveyor: survey.project_surveyor_name,
      };
    });

    return {
      statusCode: 200,
      message: "Success get Survey List",
      data: remapSurveyList,
    };
  } catch (error) {
    console.log("error: ", error);

    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
