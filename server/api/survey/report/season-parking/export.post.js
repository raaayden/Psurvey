import PDFTable from "pdfkit-table";
import fs from "fs";
import path from "path";
import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const { projectName, dateOfReport, date, seasonParkingList, totalVehicle } =
      await readBody(event);

    if (!projectName || !dateOfReport)
      return {
        statusCode: 400,
        message: "Bad Request",
      };

    const base64File = await generatePDFReport(
      projectName,
      dateOfReport,
      date,
      seasonParkingList,
      totalVehicle
    );

    return {
      statusCode: 200,
      message: "Success",
      data: base64File,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});

async function generatePDFReport(
  projectName,
  dateOfReport,
  date,
  seasonParkingList,
  totalVehicle
) {
  try {
    // Create a folder to save the PDF file
    const pdfFolderPath = path.join(process.cwd(), "assets", "report");
    console.log("pdfFolderPath: ", pdfFolderPath);

    // Check if the folder exists, if not create it
    if (!fs.existsSync(pdfFolderPath)) {
      fs.mkdirSync(pdfFolderPath, { recursive: true });
    }

    // Specify the path to save the PDF file
    const pdfPath = path.join(pdfFolderPath, "season-parking.pdf");
    console.log("pdfPath: ", pdfPath);

    // Create a new PDF document
    const doc = new PDFTable();

    // Pipe the PDF document to a write stream
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    function addText(leftText, rightText, bold) {
      if (bold) {
        doc.font("Helvetica-Bold").text(leftText, { continued: true });
        const boldWidth = leftText ? doc.widthOfString(leftText) : 0;
        const spaces = " ".repeat(20 - boldWidth / 6); // Adjust spacing as needed
        doc.font("Helvetica").text(spaces + rightText);
      } else {
        doc.text(leftText, { continued: true });
        doc.text(rightText);
      }
    }

    // Get Object Keys for the header
    let header = Object.keys(seasonParkingList[0]);
    header = header.map((element) => camelCaseToTitleCase(element));

    // Get Object Values for the rows
    const rows = seasonParkingList.map((obj) => Object.values(obj));

    function addTableWithHeaders(header, rows) {
      const pageSize = 19; // Example number, adjust as needed
      const numPages = Math.ceil(rows.length / pageSize);

      let pageNumber = 1;
      let startIndex = 0;

      while (pageNumber <= numPages) {
        // Add page
        if (pageNumber > 1) {
          doc.addPage();
        }

        // Add header
        doc.font("Helvetica");
        doc.fontSize(18).text("First Parking", {
          align: "center",
        });

        doc.font("Helvetica-Bold");
        doc.fontSize(18).text("SEASON PARKING REPORT", {
          align: "center",
          underline: true,
        });

        doc.font("Helvetica");
        doc.fontSize(18).text(`Page ${pageNumber} of ${numPages}`, {
          align: "center",
        });

        doc.moveDown();

        if (pageNumber === 1) {
          doc.fontSize(12);
          addText("Date of Report:", dateOfReport, true);
          doc.moveDown();
          addText("Project Name:", projectName, true);
          doc.moveDown();
          addText("Total Vehicle:", totalVehicle, true);

          doc.moveDown();
          doc.moveDown();
        }

        // Calculate endIndex for current page
        const endIndex = Math.min(startIndex + pageSize, rows.length);

        // Get data for current page
        const pageRows = rows.slice(startIndex, endIndex);

        // Draw table
        doc.table(
          {
            headers: header,
            rows: pageRows,
          },
          {
            prepareHeader: () => doc.font("Helvetica-Bold"),
            prepareRow: (row, i) => doc.font("Helvetica").fontSize(12),
          }
        );
        // Update startIndex and pageNumber
        startIndex += pageSize;
        pageNumber++;
      }
    }

    addTableWithHeaders(header, rows);

    // End the PDF document
    doc.end();

    // Listen for the finish event to know when the PDF is created
    await stream.on("finish", function () {
      console.log("PDF created");
    });

    // Give some time for the file to be written to disk
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get the file and convert to base64 and return
    const file = fs.readFileSync(pdfPath);
    if (!file) {
      return false;
    }
    const base64File = Buffer.from(file).toString("base64");

    return base64File;
  } catch (error) {
    console.log(error);
    return null;
  }
}

function camelCaseToTitleCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Insert space before uppercase letters preceded by a lowercase letter
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // Insert space before uppercase letters preceded by a series of uppercase letters followed by a lowercase letter
    .replace(/^./, function (s) {
      return s.toUpperCase();
    }); // Capitalize the first letter
}
