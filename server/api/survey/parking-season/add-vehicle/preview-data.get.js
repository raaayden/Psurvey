import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const { projectID, surveyDate, ALSHour } = getQuery(event);

    if (!projectID) {
      return {
        statusCode: 400,
        message: "Project ID and ALS Hour are required",
      };
    }

    const getSurveyList = await prisma.survey_list.findMany({
      where: {
        project_id: parseInt(projectID),
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
        survey_list_id: true,
        vehicle_timein: true,
        vehicle_timeout: true,
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
      },
    });

    console.log("getSurveyList: ", getSurveyList);

    if (!getSurveyList || getSurveyList.length === 0) {
      return {
        statusCode: 404,
        message: "Survey List not found",
      };
    }

    // Calculate vehicle length of stay (LOS)
    let remapSurveyList = getSurveyList.map((survey) => {
      // Check if ALSHour is not provided or if vehicle time data is missing
      if (!survey.vehicle_timein || !survey.vehicle_timeout) {
        if (ALSHour) return null; // Skip survey data if ALSHour is  provided

        return {
          projectName: survey.project.project_name,
          carPlateNumber: survey.vehicle.vehicle_plate_number,
          lengthOfStay: "-",
        };
      }

      const timeIn = DateTime.fromJSDate(survey.vehicle_timein);
      const timeOut = DateTime.fromJSDate(survey.vehicle_timeout);

      // Calculate the difference between time out and time in
      const diff = timeOut.diff(timeIn, ["hours", "minutes"]).toFormat("hh:mm");

      // If diff is null, skip this survey data
      if (diff == "Invalid Duration") return null;

      // If ALSHour is provided, only include survey data if the length of stay is greater than ALSHour
      if (ALSHour && diff >= ALSHour) {
        return {
          projectName: survey.project.project_name,
          carPlateNumber: survey.vehicle.vehicle_plate_number,
          lengthOfStay: diff,
        };
      } else if (!ALSHour) {
        // If ALSHour is not provided, include all survey data
        return {
          projectName: survey.project.project_name,
          carPlateNumber: survey.vehicle.vehicle_plate_number,
          lengthOfStay: diff,
        };
      }

      return null; // Skip survey data if it doesn't meet any condition
    });

    // Remove null values from remapSurveyList
    remapSurveyList = remapSurveyList.filter((survey) => survey !== null);

    if (remapSurveyList.length === 0) {
      return {
        statusCode: 404,
        message: "No survey data found",
      };
    }

    return {
      statusCode: 200,
      message: "Success",
      data: remapSurveyList,
    };
  } catch (error) {
    console.error("Error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
