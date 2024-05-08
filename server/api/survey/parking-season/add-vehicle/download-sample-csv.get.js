import { stringify } from "csv-stringify";

export default defineEventHandler(async (event) => {
  try {
    // Generate the sample CSV file for the user to download with 1001, 1002, 1003, 1004, 1005 as the car_plate_number
    /*
    car_plate_number
    1001
    1002
    1003
    */
    const carPlateNumbers = [
      ["car_plate_number"],
      ["1001"],
      ["1002"],
      ["1003"],
      ["1004"],
      ["1005"],
    ];

    const csvString = await new Promise((resolve, reject) => {
      stringify(carPlateNumbers, (err, output) => {
        if (err) {
          reject(err);
        }
        resolve(output);
      });
    });

    const base64String = Buffer.from(csvString).toString("base64");

    return {
      statusCode: 200,
      message: "Success",
      data: base64String,
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
