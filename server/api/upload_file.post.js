import { PrismaClient } from "@prisma/client";
import { csvParse, dsvFormat } from "d3-dsv";
import { DateTime } from "luxon";

const Prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  
  // 1. Get the raw file data
  const file = await readBody(event); 
  const fileString = file.toString();
  console.log("fileString:", fileString);

  // 2. Parse the CSV data
  let csvData; // Declare here
  try {
    csvData = dsvFormat(",");
    csvData = csvParse(fileString);

    // Map parsed CSV data into the desired data structure
    const formattedData = csvData.map((row) => {
      // console.log("Raw CSV Row:", row); // Inspect each row
      return {
        id: row.id,
        car_plate_number: row.car_plate_number,
        project: row.project,
        time_in: DateTime.fromISO(row.time_in, { zone: 'gmt' }).toISO(),
        time_out: DateTime.fromISO(row.time_out, { zone: 'gmt' }).toISO(),
        entry_exit_code: row.entry_exit_code,
        parker_type: row.parker_type,
        surveyor: row.surveyor
      };
    });
    console.error("formattedData:", formattedData);
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return { statusCode: 400, message: "Error parsing CSV" };
  }

  if (!csvData.length) { 
    return { statusCode: 400, message: "CSV file is empty" };
  }

  // 3. Iterate and Create Records
  // for (const parkingLog of csvData) {
  //   try {
  //     const addParking = await Prisma.parking_log.createMany({
  //       data: {
  //         id : parkingLog.id,
  //         car_plate_number: parkingLog.car_plate_number || null,
  //         project: parkingLog.project || null,
  //         time_in: time_in_new, 
  //         time_out: time_out_new,
  //         entry_exit_code: parkingLog.entry_exit_code || null,
  //         parker_type: parkingLog.parker_type || null,
  //         surveyor: parkingLog.surveyor || null,
  //       },
  //     });
  //     console.log("Add Parking Data: ", addParking);
  //   } catch (error) {
  //     // Handle individual record insertion errors
  //     console.error("Error inserting record:", parkingLog, error);
  //   }
  // }


  return {
    statusCode: 200,
    message: "API Route Created",
  };

});