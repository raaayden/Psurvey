import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const getFileIDs = await prisma.file.findMany({
      select: {
        file_id: true,
        file_name: true,
        created_at: true,
      },
    });

    if (!getFileIDs || getFileIDs.length === 0) {
      return {
        statusCode: 404,
        message: "File not found",
      };
    }

    let remapToOptions = getFileIDs.map((file) => {
      return {
        value: file.file_id,
        label: `${file.file_name} (${DateTime.fromJSDate(
          file.created_at
        ).toLocaleString(DateTime.DATETIME_MED)})`,
      };
    });

    // Add null option
    remapToOptions.unshift({
      value: null,
      label: "Select File to view Survey List",
    });

    return {
      statusCode: 200,
      message: "Success get File List",
      data: remapToOptions,
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
