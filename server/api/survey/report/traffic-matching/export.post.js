import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { DateTime } from "luxon";

export default defineEventHandler(async (event) => {
  try {
    const {
      projectName,
      dateOfReport,
      surveyDate,
      surveyTimeFrom,
      surveyTimeTo,
      parkerType,
      totalNumberOfRecord,
      totalRecord,
      entryRecord,
      exitRecord,
      matchedRecord,
      unmatchedRecord,
      accuracy,
    } = await readBody(event);

    if (!projectName || !dateOfReport)
      return {
        statusCode: 400,
        message: "Bad Request",
      };

    const base64File = await generatePDFReport(
      projectName,
      dateOfReport,
      surveyDate,
      surveyTimeFrom,
      surveyTimeTo,
      parkerType,
      totalNumberOfRecord,
      totalRecord,
      entryRecord,
      exitRecord,
      matchedRecord,
      unmatchedRecord,
      accuracy
    );

    if (!base64File) {
      return {
        statusCode: 400,
        message: "Success",
      };
    }

    return {
      statusCode: 200,
      message: "Success",
      data: base64File,
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});

async function generatePDFReport(
  projectName,
  dateOfReport,
  surveyDate,
  surveyTimeFrom,
  surveyTimeTo,
  parkerType,
  totalNumberOfRecord,
  totalRecord,
  entryRecord,
  exitRecord,
  matchedRecord,
  unmatchedRecord,
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
    doc.fontSize(18).text("First Parking", {
      align: "center",
    });

    doc.font("Helvetica-Bold");
    doc.fontSize(18).text("TRAFFIC MATCHING REPORT", {
      align: "center",
      underline: true,
    });

    doc.font("Helvetica");
    doc.fontSize(18).text("Page 1 of 1", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(12);
    addText("Date of Report:", dateOfReport, true);
    doc.moveDown();
    addText("Project Name:", projectName, true);
    doc.moveDown();

    addText("Date of Survey:", surveyDate ? surveyDate : "All", true);
    doc.moveDown();
    addText("Parker Type:", parkerType ? parkerType : "All", true);
    doc.moveDown();

    doc.font("Helvetica-Bold").text("Time of Survey", { continued: true });
    doc.font("Helvetica-Bold").text("   From: ", { continued: true });
    doc
      .font("Helvetica")
      .text(surveyTimeFrom ? surveyTimeFrom : "-", { continued: true });
    doc.font("Helvetica-Bold").text("   To: ", { continued: true });
    doc.font("Helvetica").text(surveyTimeTo ? surveyTimeTo : "-");

    doc.moveDown();
    doc.moveDown();

    doc.text("Number of Entry Record: " + entryRecord || 0);
    doc.moveDown();
    doc.text("Number of Exit Record: " + exitRecord) || 0;
    doc.moveDown();

    doc.moveTo(70, doc.y).lineTo(250, doc.y).stroke();
    doc.moveDown();
    doc
      .font("Helvetica-Bold")
      .text("Total Number of Records:", { continued: true });
    doc.font("Helvetica").text("   " + totalNumberOfRecord || 0);

    doc.moveDown();
    doc.moveDown();
    doc.text("Matched Records: " + matchedRecord || 0);
    doc.moveDown();
    doc.text("Unmatched Records: " + unmatchedRecord || 0);
    doc.moveDown();

    doc.moveTo(70, doc.y).lineTo(250, doc.y).stroke();
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Total:", { continued: true });
    doc.font("Helvetica").text("   " + totalRecord);

    doc.moveDown();
    doc.moveDown();
    accuracy = accuracy ? accuracy : 0;
    doc.text("Accuracy: " + accuracy + "%");

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
    console.log("Error: ", error);
    return false;
  }
}
