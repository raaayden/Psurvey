import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const {
      projectName,
      dataType,
      parkerType,
      surveyDateFrom,
      surveyDateTo,
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
        gracePeriodMin: gracePeriod ? gracePeriod : 0,
        totalALSHours: 0,
        ALSVolume: 0,
      });
    });

    let totalVolume = 0;
    let totalAllALSHours = 0;
    let averageALS = 0;

    // Example of getLookupLOS = [{id:2,name: '00 Hrs 30 mins', value: '00.30'},{id:3,name: '01 Hrs 00 mins', value: '01.00'}] until 23.30
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

      if (index === -1) {
        continue;
      }

      data[index].volume += 1;
      data[index].ALSVolume += 1;
      // data[index].totalALSHours += durationInHours;
      let hours = 0;
      if (data[index].totalALSHours !== 0) {
        hours = convertHoursMinutesToDecimal(data[index].totalALSHours);
        hours += durationInHours;
      } else {
        hours = durationInHours;
      }

      data[index].totalALSHours = convertDecimalToHoursMinutes(hours);

      totalVolume += 1;
      totalAllALSHours += durationInHours;
    }

    if (totalAllALSHours > 0 && totalVolume > 0)
      averageALS = totalAllALSHours / totalVolume;

    return {
      statusCode: 200,
      message: "Success",
      data: {
        dateOfReport,
        alsList: data,
        totalVolume,
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
