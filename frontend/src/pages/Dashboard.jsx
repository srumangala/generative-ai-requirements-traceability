import { useEffect, useRef, useState } from "react";
import "./Dashboard.css";

const emptyTotals = {
  requirements: { count: null, error: "" },
  testCases: { count: null, error: "" },
};

function Dashboard() {
  const fileInputs = useRef({});
  const [totals, setTotals] = useState(emptyTotals);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [requirementsFile, setRequirementsFile] = useState(null);
  const [requirementsUploadMessage, setRequirementsUploadMessage] = useState("");
  const [testCasesFile, setTestCasesFile] = useState(null);
  const [testCasesUploadMessage, setTestCasesUploadMessage] = useState("");
  const [uploading, setUploading] = useState({ requirements: false, testCases: false });

  useEffect(() => {
    const controller = new AbortController();
    async function loadTotals() {
      const endpoints = ["requirements", "test-cases"];
      const results = await Promise.allSettled(endpoints.map(async (endpoint) => {
        const response = await fetch(`http://localhost:8000/${endpoint}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to load total.");
        const items = await response.json();
        if (!Array.isArray(items)) throw new Error("Unexpected response format.");
        return items.length;
      }));
      if (controller.signal.aborted) return;
      const values = results.map((result) => result.status === "fulfilled"
        ? { count: result.value, error: "" }
        : { count: null, error: "Unable to load total. Please retry." });
      setTotals({ requirements: values[0], testCases: values[1] });
    }
    loadTotals();
    return () => controller.abort();
  }, [refreshIndex]);

  function refreshTotals() {
    setTotals(emptyTotals);
    setRefreshIndex((current) => current + 1);
  }

  async function handleUpload(key, endpoint, file, setFile, setMessage, label) {
    if (!file || uploading[key]) return;
    setMessage("");
    setUploading((current) => ({ ...current, [key]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`http://localhost:8000/${endpoint}/upload`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || `Failed to upload ${label}.`);
      let message = `${result.created_count} ${label} imported.`;
      if (result.skipped_count > 0) {
        message += ` ${result.skipped_count} skipped because they already exist: ${result.skipped_ids.join(", ")}.`;
      }
      setMessage(message);
      setFile(null);
      if (fileInputs.current[key]) fileInputs.current[key].value = "";
      refreshTotals();
    } catch (error) {
      setMessage(error.message || `Failed to upload ${label}. Please retry.`);
    } finally {
      setUploading((current) => ({ ...current, [key]: false }));
    }
  }

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <div className="summary-grid" aria-live="polite">
        {[
          { key: "requirements", label: "Total Requirements" },
          { key: "testCases", label: "Total Test Cases" },
        ].map(({ key, label }) => (
          <section className="summary-card" key={key} aria-busy={totals[key].count === null && !totals[key].error}>
            <h2>{label}</h2>
            {totals[key].error ? (
              <>
                <p className="error-message" role="alert">{totals[key].error}</p>
                <button onClick={refreshTotals}>Retry</button>
              </>
            ) : (
              <p className="summary-value">{totals[key].count === null ? "Loading…" : totals[key].count}</p>
            )}
          </section>
        ))}
      </div>
      <div className="upload-grid">
        <div className="upload-card">
          <h2>Upload Requirements</h2>
          <input type="file" accept=".csv" aria-label="Requirements CSV" ref={(element) => { fileInputs.current.requirements = element; }} disabled={uploading.requirements}
            onChange={(event) => setRequirementsFile(event.target.files[0])} />
          {requirementsFile && <p>Selected: {requirementsFile.name}</p>}
          <button
            onClick={() => handleUpload("requirements", "requirements", requirementsFile, setRequirementsFile, setRequirementsUploadMessage, "requirement(s)")}
            disabled={!requirementsFile || uploading.requirements}>
            {uploading.requirements ? "Uploading…" : "Upload Requirements"}
          </button>
          {requirementsUploadMessage && <p className="upload-message" role="status">{requirementsUploadMessage}</p>}
        </div>
        <div className="upload-card">
          <h2>Upload Test Cases</h2>
          <input type="file" accept=".csv" aria-label="Test cases CSV" ref={(element) => { fileInputs.current.testCases = element; }} disabled={uploading.testCases}
            onChange={(event) => setTestCasesFile(event.target.files[0])} />
          {testCasesFile && <p>Selected: {testCasesFile.name}</p>}
          <button
            onClick={() => handleUpload("testCases", "test-cases", testCasesFile, setTestCasesFile, setTestCasesUploadMessage, "test case(s)")}
            disabled={!testCasesFile || uploading.testCases}>
            {uploading.testCases ? "Uploading…" : "Upload Test Cases"}
          </button>
          {testCasesUploadMessage && <p className="upload-message" role="status">{testCasesUploadMessage}</p>}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
