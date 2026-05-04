const express = require("express");
const multer = require("multer");
const pdf = require("pdf-parse");
const XLSX = require("xlsx");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer setup
const upload = multer({ dest: "uploads/" });

/* -----------------------------
   🔥 PDF EXTRACTOR
------------------------------*/
function extractData(text = "") {
    const cleanText = text.replace(/\s+/g, " ");

    const date =
        cleanText.match(/date\s*[:\-]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i)?.[1] || "NA";

    const trn =
        cleanText.match(/(trn|transaction|ref|id)\s*[:\-]?\s*([a-z0-9]+)/i)?.[2] || "NA";

    const amount =
        cleanText.match(/(amount|total|rs|₹)\s*[:\-]?\s*([0-9,\.]+)/i)?.[2] || "NA";

    const name =
        cleanText.match(/(customer name|name)\s*[:\-]?\s*([a-z\s]+)/i)?.[2] || "NA";

    return { date, trn, amount, name };
}

/* -----------------------------
   📄 UPLOAD API
------------------------------*/
app.post("/upload", upload.array("files"), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send("No files uploaded");
        }

        let results = [];

        for (let file of req.files) {
            const buffer = fs.readFileSync(file.path);

            let text = "";

            try {
                const data = await pdf(buffer);
                text = data.text || "";
            } catch (err) {
                console.log("PDF ERROR:", file.originalname);
                text = "";
            }

            const extracted = extractData(text);

            results.push({
                file: file.originalname,
                date: extracted.date,
                trn_id: extracted.trn,
                amount: extracted.amount,
                customer_name: extracted.name
            });

            fs.unlinkSync(file.path);
        }

        // Create Excel file
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(results);
        XLSX.utils.book_append_sheet(wb, ws, "PDF_Data");

        const buffer = XLSX.write(wb, {
            type: "buffer",
            bookType: "xlsx"
        });

        /* -----------------------------
           🔥 CLEAN DATE FILE NAME
        ------------------------------*/
        const fileName = `extracted_data_${new Date().toISOString().split("T")[0]}.xlsx`;

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${fileName}`
        );

        return res.send(buffer);

    } catch (err) {
        console.error("SERVER ERROR:", err);
        return res.status(500).send("Server error");
    }
});

/* -----------------------------
   🚀 START SERVER
------------------------------*/
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}).on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.log("Port already in use");
    } else {
        console.log(err);
    }
});