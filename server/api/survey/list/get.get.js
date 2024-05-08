import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const { projectID, surveyDate, entryExitCode } = getQuery(event);

    if (!projectID) {
      return {
        statusCode: 400,
        message: "Invalid request",
      };
    }

    const getSurveyList = await prisma.survey_list.findMany({
      where: {
        project_id: parseInt(projectID),
        project_eecode: entryExitCode ? entryExitCode : undefined,
        ...(surveyDate
          ? {
              OR: [
                {
                  vehicle_timein: {
                    gte: DateTime.fromISO(surveyDate).startOf("day"),
                    lte: DateTime.fromISO(surveyDate).endOf("day"),
                  },
                },
                {
                  vehicle_timeout: {
                    gte: DateTime.fromISO(surveyDate).startOf("day"),
                    lte: DateTime.fromISO(surveyDate).endOf("day"),
                  },
                },
              ],
            }
          : {}),
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

    console.log("getSurveyList: ", getSurveyList);

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
              "dd/MM/yyyy hh:mm:ss"
            )
          : null,
        timeOut: survey.vehicle_timeout
          ? DateTime.fromJSDate(survey.vehicle_timeout).toFormat(
              "dd/MM/yyyy hh:mm:ss"
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
