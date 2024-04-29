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
        vehicle_timein: true,
        vehicle_timeout: true,
      },
    });

    console.log("getSurveyList: ", getSurveyList);

    let entryRecord = 0;
    let exitRecord = 0;
    let matchedRecord = 0;
    let unmatchedRecord = 0;
    let accuracy = 0;
    for (let i = 0; i < getSurveyList.length; i++) {
      const record = getSurveyList[i];

      // Check the time_in and time_out to determine if it is entry or exit
      // If entry, increment entryRecords and if exit, increment exitRecords
      if (record.vehicle_timein) entryRecord++;
      if (record.vehicle_timeout) exitRecord++;

      //   Check matchrecord ensure there is a match between time_in and time_out
      if (record.vehicle_timein && record.vehicle_timeout) {
        matchedRecord++;
      } else {
        unmatchedRecord++;
      }
    }

    accuracy = (matchedRecord / getSurveyList.length) * 100;
    const totalNumberOfRecord = entryRecord + exitRecord;
    const totalRecord = matchedRecord + unmatchedRecord;

    return {
      statusCode: 200,
      message: "Success get Traffic Matching",
      data: {
        projectName,
        dateOfReport,
        dataType,
        parkerType,
        surveyDateFrom,
        surveyDateTo,
        totalNumberOfRecord,
        totalRecord,
        entryRecord,
        exitRecord,
        matchedRecord,
        unmatchedRecord,
        accuracy,
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
