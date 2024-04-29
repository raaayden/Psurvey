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
    // Loop through each survey list
    for (let i = 0; i < getSurveyList.length; i++) {
      const survey = getSurveyList[i];

      console.log(survey);

      // Get the time in and time out of the vehicle
      const convertTimeIn = DateTime.fromJSDate(survey.vehicle_timein).toFormat(
        "h:mm:ss"
      );
      const convertTimeOut = DateTime.fromJSDate(
        survey.vehicle_timeout
      ).toFormat("h:mm:ss");

      // From the convertTimeIn and convertTimeOut, compare with data value to calculate the carEntry, carExit and carInPark
      for (let j = 0; j < data.length; j++) {
        const dataValue = data[j];

        console.log("Data Value ", dataValue);
        // carTotalIn = parseInt(dataValue.carInPark);

        // Convert fromTime and toTime to 24 hours format
        const fromTime = dataValue.fromTime.split(" ")[0];
        const toTime = dataValue.toTime.split(" ")[0];

        console.log("From Time ", fromTime);
        console.log("To Time ", toTime);

        dataValue.carInPark = carTotalIn;

        // Check if the vehicle time in is between the fromTime and toTime
        if (convertTimeIn >= fromTime && convertTimeIn <= toTime) {
          console.log("Car Entry ");
          dataValue.carEntry += 1;
          dataValue.carInPark += 1;
          carTotalIn += 1;
        }

        // Check if the vehicle time out is between the fromTime and toTime
        if (convertTimeOut >= fromTime && convertTimeOut <= toTime) {
          console.log("Car Exit ");
          dataValue.carExit += 1;
          dataValue.carInPark -= 1;
          carTotalIn -= 1;
        }

        console.log("------------------------------------- ");
        console.log("Car In Park ", carTotalIn);
        console.log("Car Entry ", dataValue.carEntry);
        console.log("Car Exit ", dataValue.carExit);
        console.log("------------------------------------- ");
      }
    }

    console.log(carTotalIn);

    return {
      statusCode: 200,
      message: "Success",
      data: {
        dateOfReport,
        vmbuList: data,
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
