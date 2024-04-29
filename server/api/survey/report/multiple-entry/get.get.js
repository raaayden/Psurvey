import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const { projectName, dataType, parkerType, surveyDateFrom, surveyDateTo } =
      getQuery(event);

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
        project_parker_type: parkerType ? parkerType : undefined,
        vehicle_timein: {
          gte: surveyDateFrom ? DateTime.fromISO(surveyDateFrom) : undefined,
          lte: surveyDateTo ? DateTime.fromISO(surveyDateTo) : undefined,
        },
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
    });

    console.log("getSurveyList: ", getSurveyList);

    let totalNoOfEntry = 0;

    let data = [];
    for (let i = 0; i < getSurveyList.length; i++) {
      const survey = getSurveyList[i];

      if (!survey.vehicle_timein) {
        continue;
      }

      // Get Vehicle No and Number of Entry ONLY
      const vehicleNo = survey.vehicle.vehicle_plate_number;

      // Check if vehicleNo already exists in data
      const existingData = data.find((d) => d.vehicleNo === vehicleNo);

      if (existingData) {
        existingData.entryCount++;
      } else {
        data.push({
          vehicleNo,
          entryCount: 1,
        });
      }

      totalNoOfEntry++;
    }

    // Filter only multiple entry based on rule if dataType is ADJUSTED
    let noOfEntry = 0;
    if (dataType == "ADJUSTED") {
      const getMultipleEntryRule = await prisma.parking_season_rule.findFirst({
        where: {
          parking_season_rule_id: 1,
        },
        select: {
          multiple_entry_period: true,
        },
      });

      if (!getMultipleEntryRule) {
        return {
          statusCode: 404,
          message: "Multiple Entry Rule not found",
        };
      }

      noOfEntry = getMultipleEntryRule.multiple_entry_period;

      // Filter only multiple entry
      data = data.filter((d) => d.entryCount >= noOfEntry);

      // Recalculate totalNoOfEntry
      totalNoOfEntry = data.reduce((acc, curr) => acc + curr.entryCount, 0);
    }

    return {
      statusCode: 200,
      message: "Success",
      data: {
        dateOfReport,
        projectName,
        dataType,
        parkerType,
        surveyDateFrom,
        surveyDateTo,
        totalNoOfEntry,
        noOfEntry,
        multipleEntryList: data,
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
