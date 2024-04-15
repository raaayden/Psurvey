import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { PrismaClient } from '@prisma/client';

const Prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const getParking = await Prisma.parking_log.findMany({
      select: {
        car_plate_number: true,
        project: true,
        time_in: true,
        time_out: true,
        entry_exit_code: true,
        parker_type: true,
      },
    });

    // Format data for jsPDF-AutoTable
    const formattedParking = getParking.map((parking) => ({
      'Car Plate Number': parking.car_plate_number,
      'Time In': new Date(parking.time_in).toLocaleString(),
      'Time Out': new Date(parking.time_out).toLocaleString(),
      'Project': parking.project,
      'Entry Exit Code': parking.entry_exit_code,
      'Parker Type': parking.parker_type,
    }));

    // Generate PDF report
    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.text('Parking Log Report', 50, 20); // Adjust position as needed

    // Table
    doc.autoTable({
      head: [Object.keys(formattedParking[0])],
      body: formattedParking,
      startY: 30, // Adjust starting y-position
      theme: 'plain', // Optional, other themes: 'striped', 'grid'
    });

    const pdfBytes = doc.output('arraybuffer'); // Generate binary PDF data
    const base64PdfData = Buffer.from(pdfBytes).toString('base64');

    return {
      statusCode: 200,
      message: 'success',
      data: base64PdfData,
    };
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
});
