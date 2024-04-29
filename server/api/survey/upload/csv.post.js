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

    const file = postData[0].data;
    const csvData = parse(file, { columns: true });

    console.log("csvData: ", csvData);

    if (!csvData || !csvData.length) {
      return {
        statusCode: 400,
        message:
          "There is no data in the CSV file. Please check the file and try again.",
      };
    }

    // Check if the CSV file has the required columns or not. id, car_plate_number, project, time_in, time_out, entry_exit_code, parker_type, surveyor
    const missingColumns = validateRequiredColumns(csvData);
    if (missingColumns) {
      return missingColumns;
    }

    // Check if the CSV file has any duplicate IDs
    const duplicateIds = validateDuplicateIds(csvData);
    if (duplicateIds) {
      return duplicateIds;
    }

    const checkCarPlateNumberInteger = csvData.filter((data) => {
      return isNaN(data.car_plate_number);
    });

    if (checkCarPlateNumberInteger.length) {
      return {
        statusCode: 400,
        message: "Car plate number must be a number",
      };
    }

    for (let i = 0; i < csvData.length; i++) {
      const survey = csvData[i];

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
            project_name: survey.project,
            project_eecode: survey.entry_exit_code,
            project_parker_type: survey.parker_type,
            project_surveyor_name: survey.surveyor,
            data_status: "UPLOADED",
            created_by: "SYSTEM",
            created_at: DateTime.now(),
            file: {
              connectOrCreate: {
                where: { file_name: postData[0].filename },
                create: {
                  file_name: postData[0].filename,
                  file_type: postData[0].type,
                  created_by: "SYSTEM",
                  created_at: DateTime.now(),
                },
              },
            },
            project: {
              connectOrCreate: {
                where: { project_name: survey.project },
                create: {
                  project_name: survey.project,
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
          return {
            statusCode: 500,
            message: "Internal Server Error",
          };
        }
      }
    }

    // Select file_id based on the file_name
    const fileData = await prisma.file.findFirst({
      where: {
        file_name: postData[0].filename,
      },
    });

    return {
      statusCode: 200,
      message: "Data has been saved to the database successfully.",
      data: {
        file_id: fileData.file_id,
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
