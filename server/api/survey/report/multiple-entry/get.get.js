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
      entryNo,
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
          vehicle_timein: {
            gte: DateTime.fromISO(surveyDate).startOf("day"),
            lte: DateTime.fromISO(surveyDate).endOf("day"),
          },
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
    console.log("getSurveyList.length: ", getSurveyList.length);

    let totalVehicle = 0;

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
    }

    // Filter if entryNo is provided
    if (entryNo) {
      data = data.filter((d) => d.entryCount == entryNo);
    }

    // Filter only multiple entry based on rule if dataType is ADJUSTED
    if (dataType == "ADJUSTED") {
      const getParkingSeason = await prisma.parking_season.findMany({
        where: {
          project_id: project.project_id,
          season_status: "ACTIVE",
        },
        select: {
          vehicle: {
            select: {
              vehicle_plate_number: true,
            },
          },
        },
      });

      if (getParkingSeason.length > 0) {
        const parkingSeasonData = getParkingSeason.map(
          (data) => data.vehicle.vehicle_plate_number
        );

        data = data.filter((d) => parkingSeasonData.includes(d.vehicleNo));
      } else {
        data = [];
      }
    }

    return {
      statusCode: 200,
      message: "Success",
      data: {
        dateOfReport,
        projectID: project.project_id,
        projectName,
        dataType,
        parkerType,
        surveyDate,
        surveyTimeFrom,
        surveyTimeTo,
        entryNo,
        totalVehicle: data.length,
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
