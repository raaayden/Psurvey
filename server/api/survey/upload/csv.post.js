import { DateTime } from "luxon";
import { parse } from "csv-parse/sync";

export default defineEventHandler(async (event) => {
  try {
    const postData = await readMultipartFormData(event);
    // console.log("postData: ", postData);

    if (postData?.length === 0) {
      return {
        statusCode: 400,
        message: "Bad Request",
      };
    }

    let projectName = null;
    let projectID = null;
    let fileList = [];

    // Loop thru postData
    for (let i = 0; i < postData.length; i++) {
      const form = postData[i];

      if (form.name === "project_name") {
        projectName = Buffer.from(form.data).toString("utf-8");
      } else if (form.name === "project_id") {
        projectID = Buffer.from(form.data).toString("utf-8");
      } else {
        fileList.push(form);
      }
    }

    if (!projectName || !fileList.length) {
      return {
        statusCode: 400,
        message: "Bad Request",
      };
    }

    let statusCode = 200; // Assume success initially
    let errorMessage = "";
    let csvData = [];

    fileList.forEach(async (file, index) => {
      let parsedFile = parse(file.data, { columns: true });
      // console.log("parsedFile: ", parsedFile);

      if (!parsedFile || !parsedFile.length) {
        statusCode = 400;
        errorMessage =
          "There is no data in the CSV file. Please check the file and try again.";
        return;
      }

      // Check if the CSV file has the required columns or not. id, car_plate_number, project, time_in, time_out, entry_exit_code, parker_type, surveyor
      const missingColumns = validateRequiredColumns(parsedFile);
      if (missingColumns) {
        statusCode = missingColumns.statusCode;
        errorMessage = missingColumns.message;
        return;
      }

      // Check if the CSV file has any duplicate IDs
      const duplicateIds = validateDuplicateIds(parsedFile);
      if (duplicateIds) {
        statusCode = duplicateIds.statusCode;
        errorMessage = duplicateIds.message;
        return;
      }

      const checkCarPlateNumberInteger = parsedFile.filter((data) => {
        return isNaN(data.car_plate_number);
      });

      if (checkCarPlateNumberInteger.length) {
        statusCode = 400;
        errorMessage = "Car plate number must be a number";
        return;
      }

      csvData.push(...parsedFile);
    });

    if (csvData.length === 0) {
      return {
        statusCode: 400,
        message:
          "There is no data in the CSV file. Please check the file and try again.",
      };
    }

    for (let i = 0; i < csvData.length; i++) {
      const survey = csvData[i];
      // console.log("survey: ", survey);
      console.log("Data Number: ", i + 1, " / ", csvData.length);

      // Check if the survey_id already exists in the database
      const surveyExist = await prisma.survey_list.findUnique({
        where: {
          survey_id: survey.id,
        },
      });

      // If the survey_id does not exist, insert the survey data into the database
      if (!surveyExist) {
        const insertSurvey = await prisma.survey_list.create({
          data: {
            survey_id: survey.id,
            vehicle_timein: DateTime.fromISO(survey.time_in.replace(" ", "T")),
            vehicle_timeout: DateTime.fromISO(
              survey.time_out.replace(" ", "T")
            ),
            project_name: projectName,
            project_eecode: survey.entry_exit_code,
            project_parker_type: survey.parker_type,
            project_surveyor_name: survey.surveyor,
            data_status: "UPLOADED",
            created_by: "SYSTEM",
            created_at: DateTime.now(),
            project: {
              connectOrCreate: {
                where: {
                  project_name: projectName,
                },
                create: {
                  project_name: projectName,
                  created_by: "SYSTEM",
                  created_at: DateTime.now(),
                },
              },
            },
            vehicle: {
              connectOrCreate: {
                where: {
                  vehicle_plate_number: parseInt(survey.car_plate_number),
                },
                create: {
                  vehicle_plate_number: parseInt(survey.car_plate_number),
                  vehicle_type: "CAR",
                  created_by: "SYSTEM",
                  created_at: DateTime.now(),
                },
              },
            },
          },
        });

        if (!insertSurvey) {
          statusCode = 500;
          errorMessage = "Failed to insert survey data into the database";
          return;
        }
      } else {
        // Update the survey data in the database
        const updateSurvey = await prisma.survey_list.update({
          where: {
            survey_id: survey.id,
          },
          data: {
            vehicle_timein: DateTime.fromISO(survey.time_in.replace(" ", "T")),
            vehicle_timeout: DateTime.fromISO(
              survey.time_out.replace(" ", "T")
            ),
            project_name: projectName,
            project_eecode: survey.entry_exit_code,
            project_parker_type: survey.parker_type,
            project_surveyor_name: survey.surveyor,
            data_status: "RE-UPLOADED",
            updated_by: "SYSTEM",
            updated_at: DateTime.now(),
            project: {
              connect: {
                project_name: projectName,
              },
            },
            vehicle: {
              connect: {
                vehicle_plate_number: parseInt(survey.car_plate_number),
              },
            },
          },
        });

        if (!updateSurvey) {
          statusCode = 500;
          errorMessage = "Failed to update survey data in the database";
          return;
        }
      }
    }

    // Select the last file in the fileList
    const getProject = await prisma.project.findFirst({
      select: {
        project_id: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return {
      statusCode: statusCode,
      message:
        errorMessage || "Data has been successfully uploaded to the database",
      data: {
        projectID: getProject.project_id,
      },
    };
  } catch (error) {
    console.log("Error: ", error.message);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});

function validateRequiredColumns(csvData) {
  const requiredColumns = [
    "id",
    "car_plate_number",
    "project",
    "time_in",
    "time_out",
    "entry_exit_code",
    "parker_type",
    "surveyor",
  ];

  const csvColumns = Object.keys(csvData[0]);

  const missingColumns = requiredColumns.filter(
    (column) => !csvColumns.includes(column)
  );

  if (missingColumns.length) {
    return {
      statusCode: 400,
      message: `The CSV file is missing the following columns: ${missingColumns.join(
        ", "
      )}`,
    };
  }

  return null;
}

function validateDuplicateIds(csvData) {
  const ids = csvData.map((data) => data.id);
  const uniqueIds = [...new Set(ids)];

  if (ids.length !== uniqueIds.length) {
    return {
      statusCode: 400,
      message: "The CSV file has duplicate IDs",
    };
  }

  return null;
}

function getUniqueDataByColumn(csvData, column) {
  const uniqueData = [...new Set(csvData.map((data) => data[column]))];
  return uniqueData;
}
