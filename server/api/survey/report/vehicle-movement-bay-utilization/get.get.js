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

    const getLookupVMBUR = await getLookupListOptions("VMBUR");
    if (!getLookupVMBUR) {
      return {
        statusCode: 500,
        message: "Internal Server Error",
      };
    }

    let data = [];

    // from TableTitle, assign each of the title with default value from getLookupLOS
    getLookupVMBUR.forEach((lookup, index) => {
      // Split lookup value eg: 00:00:00-00:29:00

      // Convert fromTime to become 12:00:00 AM and toTime to become 12:29:00 AM
      let fromTime = lookup.value.split("-")[0];
      let toTime = lookup.value.split("-")[1];

      // Convert fromTime and toTime to 12 hours format
      fromTime = convert24Hourto12HourFormat(fromTime);
      toTime = convert24Hourto12HourFormat(toTime);

      data.push({
        no: index + 1,
        date: "",
        fromTime: fromTime,
        toTime: toTime,
        carEntry: 0,
        carExit: 0,
        carInPark: 0,
      });
    });

    let carTotalIn = 0;
    let carTotalEntry = 0;
    let carTotalExit = 0;
    let maxTimeCarInPark = {
      fromTime: "",
      toTime: "",
      value: 0,
    };
    let minTimeCarInPark = {
      fromTime: "11:00:00 PM",
      toTime: "11:29:00 PM",
      value: 0,
    };

    for (let i = 0; i < data.length; i++) {
      const lookup = data[i];

      // convert to 24 hours format
      const fromTime = DateTime.fromFormat(
        lookup.fromTime,
        "h:mm:ss a"
      ).toFormat("HH:mm:ss");
      const toTime = DateTime.fromFormat(lookup.toTime, "h:mm:ss a").toFormat(
        "HH:mm:ss"
      );

      // let toTime = lookup.toTime.split(" ")[0];

      let carEntry = 0;
      let carExit = 0;
      let carInPark = 0;
      let date = "";

      for (let j = 0; j < getSurveyList.length; j++) {
        const survey = getSurveyList[j];

        if (!date)
          date = DateTime.fromJSDate(survey.vehicle_timein).toFormat(
            "dd/MM/yyyy"
          );

        console.log("date 1", date);

        const convertTimeIn = DateTime.fromJSDate(
          survey.vehicle_timein
        ).toFormat("HH:mm:ss");
        const convertTimeOut = DateTime.fromJSDate(
          survey.vehicle_timeout
        ).toFormat("HH:mm:ss");

        carInPark = carTotalIn;

        if (convertTimeIn >= fromTime && convertTimeIn <= toTime) {
          carEntry += 1;
          carInPark += 1;
          carTotalIn += 1;
          carTotalEntry += 1;

          if (carInPark >= maxTimeCarInPark.value) {
            maxTimeCarInPark.fromTime = DateTime.fromFormat(
              fromTime,
              "HH:mm:ss"
            ).toFormat("h:mm:ss a");
            maxTimeCarInPark.toTime = DateTime.fromFormat(
              toTime,
              "HH:mm:ss"
            ).toFormat("h:mm:ss a");
            maxTimeCarInPark.value = carInPark;
          }
        }

        if (convertTimeOut >= fromTime && convertTimeOut <= toTime) {
          carExit += 1;
          carInPark -= 1;
          carTotalIn -= 1;
          carTotalExit += 1;

          if (carInPark < minTimeCarInPark.value) {
            minTimeCarInPark.fromTime = DateTime.fromFormat(
              fromTime,
              "HH:mm:ss"
            ).toFormat("h:mm:ss a");
            minTimeCarInPark.toTime = DateTime.fromFormat(
              toTime,
              "HH:mm:ss"
            ).toFormat("h:mm:ss a");
            minTimeCarInPark.value = carInPark;
          }
        }
      }

      data[i] = {
        ...data[i],
        date: DateTime.fromFormat(surveyDate, "yyyy-MM-dd").toFormat(
          "dd/MM/yyyy"
        ),
        carEntry,
        carExit,
        carInPark,
      };
    }

    console.log("carTotalIn", carTotalIn);
    console.log("carTotalEntry", carTotalEntry);
    console.log("carTotalExit", carTotalExit);
    console.log("maxTimeCarInPark", maxTimeCarInPark);
    console.log("minTimeCarInPark", minTimeCarInPark);

    return {
      statusCode: 200,
      message: "Success",
      data: {
        dateOfReport,
        projectName,
        vmbuList: data,
        carTotalIn,
        carTotalEntry,
        carTotalExit,
        maxTimeCarInPark,
        minTimeCarInPark,
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

function convert24Hourto12HourFormat(time) {
  // Split the time string into hours and minutes
  var timeParts = time.split(":");
  var hours = parseInt(timeParts[0]);
  var minutes = parseInt(timeParts[1]);

  // If hours is 00, set it to 12
  hours = hours === 0 ? 12 : hours;

  // Calculate the decimal representation of time
  var decimal = hours + minutes / 60;

  // Convert to 12 hours format
  var hours12 = hours % 12;
  hours12 = hours12 === 0 ? 12 : hours12;
  var ampm = hours < 12 ? "AM" : "PM";

  return hours12 + ":" + (minutes < 10 ? "0" : "") + minutes + ":00 " + ampm;
}
