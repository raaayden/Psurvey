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
      gracePeriod,
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
        vehicle_timein: true,
        vehicle_timeout: true,
      },
    });

    const getLookupLOS = await getLookupListOptions("LOS");
    if (!getLookupLOS) {
      return {
        statusCode: 500,
        message: "Internal Server Error",
      };
    }

    let data = [];

    // from TableTitle, assign each of the title with default value from getLookupLOS
    getLookupLOS.forEach((lookup) => {
      data.push({
        lengthOfStay: lookup.name,
        volume: 0,
        totalALSHours: 0,
      });
    });

    let totalVehicle = 0;
    let gracePeriodVolume = 0;
    let totalAllALSHours = 0;
    let averageALS = 0;

    let convertedGracePeriod = 0;

    // Convert grace period of minutes to hh:mm format
    if (gracePeriod) {
      const gracePeriodInHours = gracePeriod / 60;
      convertedGracePeriod = convertDecimalToHoursMinutes(gracePeriodInHours);
    }

    for (let i = 0; i < getSurveyList.length; i++) {
      const survey = getSurveyList[i];

      if (!survey.vehicle_timein || !survey.vehicle_timeout) {
        continue;
      }

      // Get length of stay by comparing time_in and time_out of each survey
      const timeIn = DateTime.fromJSDate(survey.vehicle_timein);
      const timeOut = DateTime.fromJSDate(survey.vehicle_timeout);

      const duration = timeOut.diff(timeIn, ["hours", "minutes"]);
      const durationInHours = duration.hours + duration.minutes / 60;

      // Find the closest match and increment the count for that match
      const closestMatch = getLookupLOS.reduce((prev, curr) =>
        Math.abs(curr.value - durationInHours) <
        Math.abs(prev.value - durationInHours)
          ? curr
          : prev
      );

      // search from data array and increment the volume for that match
      const index = data.findIndex(
        (item) => item.lengthOfStay === closestMatch.name
      );

      // If not found, skip to next iteration
      if (index === -1) {
        continue;
      }

      // Increment total vehicle
      totalVehicle += 1;

      // Check if duration is more than grace period
      if (convertedGracePeriod) {
        if (
          durationInHours >=
          convertHoursMinutesToDecimal(convertedGracePeriod).toFixed(2)
        ) {
          continue;
        }

        // Increment grace period volume
        gracePeriodVolume += 1;
      }

      // Calculate total ALS hours
      let hours = 0;
      if (data[index].totalALSHours !== 0) {
        hours = convertHoursMinutesToDecimal(data[index].totalALSHours);
        hours += durationInHours;
      } else {
        hours = durationInHours;
      }

      // Convert total ALS hours to hh:mm format
      data[index].totalALSHours = convertDecimalToHoursMinutes(hours);

      // Increment the volume for that match
      data[index].volume += 1;
      totalAllALSHours += durationInHours;
    }

    if (totalAllALSHours > 0 && gracePeriodVolume > 0)
      averageALS = totalAllALSHours / gracePeriodVolume;

    return {
      statusCode: 200,
      message: "Success",
      data: {
        dateOfReport,
        alsList: data,
        totalVehicle,
        gracePeriodVolume,
        grandTotalVolume: totalVehicle - gracePeriodVolume,
        averageALS: convertDecimalToHoursMinutes(averageALS),
        totalAllALSHours: convertDecimalToHoursMinutes(totalAllALSHours),
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

function convertDecimalToHoursMinutes(decimal) {
  // Split the decimal number into its integer and fractional parts
  var hours = Math.floor(decimal);
  var minutes = Math.round((decimal - hours) * 60); // Convert fractional part to minutes

  // if minutes is 60, increment hours and set minutes to 0
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }

  // Format the result as hours:minutes
  return hours + ":" + (minutes < 10 ? "0" : "") + minutes;
}

function convertHoursMinutesToDecimal(time) {
  // Split the time string into hours and minutes
  var timeParts = time.split(":");
  var hours = parseInt(timeParts[0]);
  var minutes = parseInt(timeParts[1]);

  // Calculate the decimal representation of time
  var decimal = hours + minutes / 60;

  return decimal;
}
