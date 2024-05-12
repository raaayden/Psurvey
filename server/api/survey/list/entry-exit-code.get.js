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
        project_eecode: true,
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

    // From the surveyList, get the unique eeCodes
    let uniqueEeCodes = surveyList.map((survey) => {
      return survey.project_eecode;
    });

    // Remove duplicates
    uniqueEeCodes = [...new Set(uniqueEeCodes)];

    // Sort the uniqueEeCodes
    uniqueEeCodes.sort();

    // Remap to options
    let remapToOptions = uniqueEeCodes.map((eeCode) => {
      return {
        value: eeCode,
        label: eeCode,
      };
    });

    if (type == "select") {
      // Add null option
      remapToOptions.unshift({
        value: null,
        label: "Select Entry Exit Code",
      });
    }

    return {
      statusCode: 200,
      message: "Success get Entry Exit Code List",
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
