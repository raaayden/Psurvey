import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const { projectID, projectName, type } = getQuery(event);

    if (!projectID && !projectName) {
      return {
        statusCode: 400,
        message: "Project ID is required",
      };
    }

    const surveyList = await prisma.survey_list.findMany({
      select: {
        vehicle_timein: true,
        vehicle_timeout: true,
      },
      where: {
        project_id: projectID ? parseInt(projectID) : undefined,
        project_name: projectName ? projectName : undefined,
        vehicle_timein: {
          not: null,
        },
        vehicle_timeout: {
          not: null,
        },
      },
    });

    if (!surveyList || surveyList.length === 0) {
      return {
        statusCode: 404,
        message: "Survey List not found",
      };
    }

    // From the surveyList, get the unique dates
    let uniqueDates = surveyList.map((survey) => {
      return DateTime.fromJSDate(
        survey.vehicle_timein || survey.vehicle_timeout
      ).toISODate();
    });

    // Remove duplicates
    uniqueDates = [...new Set(uniqueDates)];

    // Sort the uniqueDates
    uniqueDates.sort();

    // Remap to options
    let remapToOptions = uniqueDates.map((date) => {
      return {
        value: date,
        label: DateTime.fromISO(date).toFormat("dd/MM/yyyy"),
      };
    });

    if (type == "select") {
      // Add null option
      remapToOptions.unshift({
        value: null,
        label: "Select Date",
      });
    } else {
      // Add null option
      remapToOptions.unshift({
        value: null,
        label: "All Dates",
      });
    }

    return {
      statusCode: 200,
      message: "Success get Survey List",
      data: remapToOptions,
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
