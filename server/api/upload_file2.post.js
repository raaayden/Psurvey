import { PrismaClient } from "@prisma/client";
import { csvParse } from "d3-dsv";
import { DateTime } from "luxon";


export default defineEventHandler(async (event) => {
  console.log('csvData: ', event);
});