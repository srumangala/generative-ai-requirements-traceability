import { useState } from "react";
import "./Dashboard.css";


function Dashboard() {
  const [requirementsFile, setRequirementsFile] = useState(null);
  const [requirementsUploadMessage, setRequirementsUploadMessage] = useState("");

  const [testCasesFile, setTestCasesFile] = useState(null);
  const [testCasesUploadMessage, setTestCasesUploadMessage] = useState("");

  async function handleRequirementsUpload() {
    if (!requirementsFile) {
      return;
    }

    setRequirementsUploadMessage("");

    const formData = new FormData();
    formData.append("file", requirementsFile);

    const response = await fetch("http://localhost:8000/requirements/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();

      setRequirementsUploadMessage(
        errorData.detail || "Failed to upload requirements."
      );

      return;
    }
    const result = await response.json();



    setRequirements((currentRequirements) => [
      ...currentRequirements,
      ...result.created_items,
    ]);

    let message = `${result.created_count} requirement(s) imported.`;

    if (result.skipped_count > 0) {
      message += ` ${result.skipped_count} skipped because they already exist: ${result.skipped_ids.join(", ")}.`;
    }
    setRequirementsUploadMessage(message);
    setRequirementsFile(null);
  }

  async function handleTestCasesUpload() {
    if (!testCasesFile) {
      return;
    }

    setTestCasesUploadMessage("");

    const formData = new FormData();
    formData.append("file", testCasesFile);

    const response = await fetch("http://localhost:8000/test-cases/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();

      setTestCasesUploadMessage(
        errorData.detail || "Failed to upload test cases."
      );

      return;
    }

    const result = await response.json();

    setTestCases((currentTestCases) => [
      ...currentTestCases,
      ...result.created_items,
    ]);

    let message = `${result.created_count} test case(s) imported.`;

    if (result.skipped_count > 0) {
      message += ` ${result.skipped_count} skipped because they already exist: ${result.skipped_ids.join(", ")}.`;
    }

    setTestCasesUploadMessage(message);

    setTestCasesFile(null);
  }

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>

      <div className="upload-grid">
        <div className="upload-card">
          <h2>Upload Requirements</h2>
          <input
            type="file"
            onChange={(event) =>
              setRequirementsFile(event.target.files[0])
            }
          />

          {requirementsFile && (
            <p>Selected: {requirementsFile.name}</p>
          )}
          <button
            onClick={handleRequirementsUpload}
            disabled={!requirementsFile}
          >
            Upload Requirements
          </button>
          {requirementsUploadMessage && (
            <p className="upload-message">
              {requirementsUploadMessage}
            </p>
          )}
        </div>
        <div className="upload-card">
          <h2>Upload Test Cases</h2>
          <input
            type="file"
            onChange={(event) =>
              setTestCasesFile(event.target.files[0])
            }
          />

          {testCasesFile && (
            <p>Selected: {testCasesFile.name}</p>
          )}

          <button
            onClick={handleTestCasesUpload}
            disabled={!testCasesFile}
          >
            Upload Test Cases
          </button>
          {testCasesUploadMessage && (
            <p className="upload-message">
              {testCasesUploadMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;