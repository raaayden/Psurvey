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

    let projectID = null;
    let file = null;

    for (let i = 0; i < postData.length; i++) {
      const form = postData[i];
      if (form.name === "project_id") {
        projectID = Buffer.from(form.data).toString("utf-8");
      } else {
        file = form.data;
      }
    }

    if (!projectID || !file) {
      return {
        statusCode: 400,
        message: "Bad Request",
      };
    }

    let parsedFile = parse(file, { columns: true });
    console.log("parsedFile: ", parsedFile);

    if (!parsedFile || !parsedFile.length) {
      return {
        statusCode: 400,
        message:
          "There is no data in the CSV file. Please check the file and try again.",
      };
    }

    // Check if object key has car_plate_number
    const missingColumns = validateRequiredColumns(parsedFile);
    if (missingColumns) {
      return missingColumns;
    }

    // Select project name from project ID
    const projectName = await prisma.project.findUnique({
      where: {
        project_id: parseInt(projectID),
      },
      select: {
        project_name: true,
      },
    });

    // append every object with project_name
    parsedFile = parsedFile.map((obj) => {
      return {
        carPlateNumber: obj.car_plate_number,
        projectName: projectName.project_name,
      };
    });

    return {
      statusCode: 200,
      message: "Success",
      data: parsedFile,
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});

function validateRequiredColumns(parsedFile) {
  const requiredColumns = ["car_plate_number"];

  const missingColumns = requiredColumns.filter(
    (column) => !parsedFile[0].hasOwnProperty(column)
  );

  if (missingColumns.length) {
    return {
      statusCode: 400,
      message: `The following columns are missing in the CSV file: ${missingColumns.join(
        ", "
      )}`,
    };
  }

  return null;
}
