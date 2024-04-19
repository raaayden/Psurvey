import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";
import fs from "fs";
import path from "path";

export default defineEventHandler(async (event) => {
  try {
    const { data, type } = await readBody(event);

    if (!data || !type) {
      return {
        statusCode: 400,
        message: "Bad Request",
      };
    }

    if (type !== "pdf" && type !== "excel") {
      return {
        statusCode: 400,
        message: "Invalid type",
      };
    }

    // Hard code data change later
    const hardCodeData = {
      dateReport: "2021-09-01",
      projectName: "Project 1",
      categoryTraffic: "All",
      vehicleType: "Car",
      timeSurveyFrom: "08:00",
      timeSurveyTo: "09:00",
    };

    let entryRecords = 0;
    let exitRecords = 0;
    let matchedRecords = 0;
    let unmatchedRecords = 0;
    let accuracy = 0;

    for (let i = 0; i < data.length; i++) {
      const record = data[i];

      // Check the time_in and time_out to determine if it is entry or exit
      // If entry, increment entryRecords and if exit, increment exitRecords
      if (record.time_in) entryRecords++;
      if (record.time_out) exitRecords++;

      //   Check matchrecord ensure there is a match between time_in and time_out
      if (record.time_in && record.time_out) {
        matchedRecords++;
      } else {
        unmatchedRecords++;
      }
    }

    accuracy = (matchedRecords / data.length) * 100;
    const totalNumberOfRecords = entryRecords + exitRecords;
    const total = matchedRecords + unmatchedRecords;

    let base64File = null;

    if (type === "pdf") {
      base64File = await generatePDFReport(
        hardCodeData,
        entryRecords,
        exitRecords,
        totalNumberOfRecords,
        matchedRecords,
        unmatchedRecords,
        total,
        accuracy
      );

      if (!base64File) {
        return {
          statusCode: 500,
          message: "Internal Server Error",
        };
      }
    } else {
      // Generate excel file
      base64File = await generateExcelReport(
        hardCodeData,
        entryRecords,
        exitRecords,
        totalNumberOfRecords,
        matchedRecords,
        unmatchedRecords,
        total,
        accuracy
      );

      if (!base64File) {
        return {
          statusCode: 500,
          message: "Internal Server Error",
        };
      }
    }

    return {
      statusCode: 200,
      message: "Data exported successfully",
      data: base64File,
    };
  } catch (error) {
    console.log("Error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});

async function generatePDFReport(
  hardCodeData,
  entryRecords,
  exitRecords,
  totalNumberOfRecords,
  matchedRecords,
  unmatchedRecords,
  total,
  accuracy
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
    const pdfPath = path.join(pdfFolderPath, "traffic-matching-report.pdf");
    console.log("pdfPath: ", pdfPath);

    // Create a new PDF document
    const doc = new PDFDocument();

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

    // Add content to the PDF document
    doc.font("Helvetica");
    doc.fontSize(20).text("First Parking", {
      align: "center",
    });

    doc.font("Helvetica-Bold");
    doc.fontSize(20).text("TRAFFIC MATCHING REPORT", {
      align: "center",
      underline: true,
    });

    doc.font("Helvetica");
    doc.fontSize(20).text("Page 1 of 1", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(12);
    addText("Date of Report:", hardCodeData.dateReport, true);
    doc.moveDown();
    addText("Project Name:", hardCodeData.projectName, true);
    doc.moveDown();
    addText("Category Traffic:", hardCodeData.categoryTraffic, true);
    doc.moveDown();
    addText("Vehicle Type:", hardCodeData.vehicleType, true);
    doc.moveDown();

    doc.font("Helvetica-Bold").text("Time of Survey", { continued: true });
    doc.font("Helvetica-Bold").text("   From: ", { continued: true });
    doc
      .font("Helvetica")
      .text(hardCodeData.timeSurveyFrom, { continued: true });
    doc.font("Helvetica-Bold").text("   To: ", { continued: true });
    doc.font("Helvetica").text(hardCodeData.timeSurveyTo);

    doc.moveDown();
    doc.moveDown();

    doc.text("Number of Entry Record: " + entryRecords);
    doc.moveDown();
    doc.text("Number of Exit Record: " + exitRecords);
    doc.moveDown();

    doc.moveTo(70, doc.y).lineTo(250, doc.y).stroke();
    doc.moveDown();
    doc
      .font("Helvetica-Bold")
      .text("Total Number of Records:", { continued: true });
    doc.font("Helvetica").text("   " + totalNumberOfRecords);

    doc.moveDown();
    doc.moveDown();
    doc.text("Matched Records: " + matchedRecords);
    doc.moveDown();
    doc.text("Unmatched Records: " + unmatchedRecords);
    doc.moveDown();

    doc.moveTo(70, doc.y).lineTo(250, doc.y).stroke();
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Total:", { continued: true });
    doc.font("Helvetica").text("   " + total);

    doc.moveDown();
    doc.moveDown();
    doc.text("Accuracy: " + accuracy + "%");

    doc.end();

    // Listen for the finish event to know when the PDF is created
    stream.on("finish", function () {
      console.log("PDF created");
    });

    // Get the file and convert to base64 and return
    const file = fs.readFileSync(pdfPath);
    if (!file) {
      return false;
    }
    const base64File = Buffer.from(file).toString("base64");

    return base64File;
  } catch (error) {
    console.log("Error: ", error);
    return false;
  }
}

async function generateExcelReport(
  hardCodeData,
  entryRecords,
  exitRecords,
  totalNumberOfRecords,
  matchedRecords,
  unmatchedRecords,
  total,
  accuracy
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
    const csvPath = path.join(pdfFolderPath, "traffic-matching-report.csv");
    console.log("pdfPath: ", csvPath);

    // Generate the CSV content
    const output = stringify([
      ["First Parking"],
      ["TRAFFIC MATCHING REPORT"],
      ["Page 1 of 1"],
      [""],
      ["Date of Report:", hardCodeData.dateReport],
      ["Project Name:", hardCodeData.projectName],
      ["Category Traffic:", hardCodeData.categoryTraffic],
      ["Vehicle Type:", hardCodeData.vehicleType],
      [
        "Time of Survey",
        "From:",
        hardCodeData.timeSurveyFrom,
        "To:",
        hardCodeData.timeSurveyTo,
      ],
      [""],
      ["Number of Entry Record:", entryRecords],
      ["Number of Exit Record:", exitRecords],
      [""],
      ["Total Number of Records:", totalNumberOfRecords],
      [""],
      ["Matched Records:", matchedRecords],
      ["Unmatched Records:", unmatchedRecords],
      [""],
      ["Total:", total],
      [""],
      ["Accuracy:", accuracy + "%"],
    ]);

    // Write the CSV content to a file
    fs.writeFileSync(csvPath, output, "utf8", (err) => {
      if (err) {
        console.error("Error writing CSV file:", err);
      } else {
        console.log("CSV file written successfully");
      }
    });

    //  Get the file and convert to base64 and return
    const file = fs.readFileSync(csvPath);
    console.log("csvPath: ", csvPath);
    console.log("file: ", file);
    if (!file) {
      return false;
    }
    const base64File = Buffer.from(file).toString("base64");

    console.log("base64File: ", base64File);

    return base64File;
  } catch (error) {
    console.log("Error: ", error);
    return false;
  }
}
