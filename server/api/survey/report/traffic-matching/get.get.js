import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const {
      projectName,
      dataType,
      parkerType,
      surveyDate,
      surveyTimeFrom,
      surveyTimeTo,
    } = getQuery(event);

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

    let combinedDateTimeFrom = null;
    let combinedDateTimeTo = null;

    if (surveyDate) {
      if (surveyTimeFrom) {
        // Combine surveyDate and surveyTimeFrom  because surveyDate format is yyyy-MM-dd and surveyTimeFrom format is HH:mm
        combinedDateTimeFrom = DateTime.fromFormat(
          surveyDate + " " + surveyTimeFrom,
          "yyyy-MM-dd HH:mm"
        );
      }

      if (surveyTimeTo) {
        // Combine surveyDate and surveyTimeTo  because surveyDate format is yyyy-MM-dd and surveyTimeTo format is HH:mm
        combinedDateTimeTo = DateTime.fromFormat(
          surveyDate + " " + surveyTimeTo,
          "yyyy-MM-dd HH:mm"
        );
      }
    }

    const getSurveyList = await prisma.survey_list.findMany({
      where: {
        project_id: project.project_id,
        project_parker_type: parkerType ? parkerType : undefined,
        ...(surveyDate && {
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
        }),
        // Conditionally include vehicle_timein filter
        ...(combinedDateTimeFrom && {
          vehicle_timein: {
            gte: combinedDateTimeFrom.toISO(),
          },
        }),
        // Conditionally include vehicle_timeout filter
        ...(combinedDateTimeTo && {
          vehicle_timeout: {
            lte: combinedDateTimeTo.toISO(),
          },
        }),
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

    accuracy = (matchedRecord / entryRecord) * 100;
    const totalNumberOfRecord = entryRecord + exitRecord;
    const totalRecord = matchedRecord + unmatchedRecord;

    return {
      statusCode: 200,
      message: "Success get Traffic Matching",
      data: {
        projectName,
        dateOfReport,
        dataType,
        parkerType: parkerType ? parkerType : "All",
        surveyDate: surveyDate
          ? DateTime.fromISO(surveyDate).toFormat("dd/MM/yyyy")
          : "All",
        surveyTimeFrom,
        surveyTimeTo,
        totalNumberOfRecord,
        totalRecord,
        entryRecord,
        exitRecord,
        matchedRecord,
        unmatchedRecord,
        accuracy: accuracy ? accuracy.toFixed(2) : 0,
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
