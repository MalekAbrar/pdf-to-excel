import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Select PDF files first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await axios.post("http://localhost:5000/upload", formData, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Extracted_${Date.now()}.xlsx`;
      link.click();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">

      {/* TOP BAR */}
      <div className="topbar">
        <div className="logo">📊 VIRAT SALES PVT LTD</div>
        <div className="tag">PDF → Excel System</div>
      </div>

      {/* MAIN CARD */}
      <div className="card">

        <h1>PDF Data Extractor</h1>
        <p>Upload invoices and convert into structured Excel file</p>

        <label className="dropZone">
          <input type="file" multiple onChange={handleChange} />
          <div>
            <h3>📂 Drag & Drop Files Here</h3>
            <p>{files.length ? `${files.length} file selected` : "or click to browse"}</p>
          </div>
        </label>

        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Processing..." : "Generate Excel 🚀"}
        </button>

      </div>

      {/* FOOTER */}
      <div className="footer">
        Built for automation • Fast • Simple • Reliable
      </div>

    </div>
  );
}

export default App;