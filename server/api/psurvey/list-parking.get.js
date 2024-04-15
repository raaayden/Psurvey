import { PrismaClient } from "@prisma/client";

const Prisma = new PrismaClient();

export default defineEventHandler(async (event) => {

  const getParking = await Prisma.parking_log.findMany({
    select: {
      car_plate_number: true,
      project: true,
      time_in: true,
      time_out: true,
      entry_exit_code: true,
      parker_type: true
    },
  });

  // Format the time_in and time_out fields
  const formattedParking = getParking.map((parking) => ({
    ...parking,
    time_in: new Date(parking.time_in).toLocaleString(),
    time_out: new Date(parking.time_out).toLocaleString(),
  }));

  return {
    statusCode: 200,
    message: "GET List of Parking Log Success",
    data: formattedParking,
  };

});