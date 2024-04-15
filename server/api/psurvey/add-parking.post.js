import { PrismaClient } from "@prisma/client";
// import { useUserStore } from '~/stores/user'; 
import { DateTime } from "luxon";

const Prisma = new PrismaClient();

export default defineEventHandler(async (event) => {

  const { car_plate_no, project, time_in, time_out, exit_code, parker_type } = await readBody(event);

  
  console.log("Received data:", readBody(event));

  if(!car_plate_no || !project || !time_in || !time_out || !exit_code || !parker_type) {
    return {
      statusCode : 400,
      message : "Missing required field"
    }
  }

  if(exit_code == 'Please Select' || parker_type == 'Please Select') {
    return {
      statusCode : 400,
      message : "Invalid Data"
    }
  }

  let dt_in = DateTime.fromISO(time_in, { zone: 'gmt' }); // Force UTC
  let time_in_new = dt_in.toISO();
  let dt_out = DateTime.fromISO(time_out, { zone: 'gmt' }); // Force UTC
  let time_out_new = dt_out.toISO();

  const addParking = await Prisma.parking_log.create({
    data:{
      car_plate_number: car_plate_no,
      project: project,
      time_in: time_in_new,
      time_out: time_out_new,
      entry_exit_code: exit_code,
      parker_type: parker_type,
      surveyor: "Admin"
    },
  });
  console.log("Add Parkign Data: ", addParking);

  return {
    statusCode: 200,
    message: "API Route Created",
    data: addParking,
  };

});