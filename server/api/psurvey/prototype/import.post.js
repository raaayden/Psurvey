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
        message: "Bad Request",
      };
    }

    return {
      statusCode: 200,
      message: "Data imported successfully",
      data: csvData,
    };
  } catch (error) {
    console.log("Error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
