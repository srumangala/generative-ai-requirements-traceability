import { useEffect, useState } from "react";
import "./DataPage.css";


function DataPage() {
  const [requirementsFile, setRequirementsFile] = useState(null);
  const [testCasesFile, setTestCasesFile] = useState(null);

  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);

  const [newRequirementId, setNewRequirementId] = useState("");
  const [newRequirementDescription, setNewRequirementDescription] = useState("");

  const [newTestCaseId, setNewTestCaseId] = useState("");
  const [newTestCaseTitle, setNewTestCaseTitle] = useState("");
  const [newTestCaseDescription, setNewTestCaseDescription] = useState("");

  const [requirementError, setRequirementError] = useState("");
  const [testCaseError, setTestCaseError] = useState("");

  const [requirementsUploadMessage, setRequirementsUploadMessage] = useState("");
  const [testCasesUploadMessage, setTestCasesUploadMessage] = useState("");

  async function handleCreateRequirement() {
    const response = await fetch("http://localhost:8000/requirements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requirement_id: newRequirementId,
        description: newRequirementDescription,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      setRequirementError(
        errorData.detail || "Failed to create requirement."
      );

      return;
    }

    const createdRequirement = await response.json();

    setRequirements((currentRequirements) => [
      ...currentRequirements,
      createdRequirement,
    ]);

    setRequirementError("");

    setNewRequirementId("");
    setNewRequirementDescription("");
  }

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

  async function handleCreateTestCase() {
    const response = await fetch("http://localhost:8000/test-cases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        test_case_id: newTestCaseId,
        title: newTestCaseTitle,
        description: newTestCaseDescription,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      setTestCaseError(
        errorData.detail || "Failed to create test case."
      );

      return;
    }

    const createdTestCase = await response.json();

    setTestCases((currentTestCases) => [
      ...currentTestCases,
      createdTestCase,
    ]);

    setTestCaseError("");

    setNewTestCaseId("");
    setNewTestCaseTitle("");
    setNewTestCaseDescription("");
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


  useEffect(() => {
    fetch("http://localhost:8000/requirements")
      .then((response) => response.json())
      .then((data) => setRequirements(data))
      .catch((error) => console.error("Failed to load requirements:", error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/test-cases")
      .then((response) => response.json())
      .then((data) => setTestCases(data))
      .catch((error) => console.error("Failed to load test cases:", error));
  }, []);


  return (
    <div className="data-page">
      <h1>Data</h1>

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

      <section className="data-section">
        <h2>Requirements</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Requirement</th>
            </tr>
          </thead>

          <tbody>
            {requirements.map((requirement) => (
              <tr key={requirement.requirement_id}>
                <td>{requirement.requirement_id}</td>
                <td>{requirement.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="create-form">
          <h3>Add Requirement</h3>

          <div className="form-row">
            <div className="form-field small-field">
              <label>Requirement ID</label>
              <input
                type="text"
                placeholder="REQ-001"
                value={newRequirementId}
                onChange={(event) => {
                  setNewRequirementId(event.target.value);
                  setRequirementError("");
                }}
              />
            </div>

            <div className="form-field">
              <label>Description</label>
              <textarea
                placeholder="Describe the requirement..."
                value={newRequirementDescription}
                onChange={(event) =>
                  setNewRequirementDescription(event.target.value)
                }
              />
            </div>
          </div>

          <button
            className="add-button"
            onClick={handleCreateRequirement}
            disabled={
              !newRequirementId.trim() ||
              !newRequirementDescription.trim()
            }
          >
            Add Requirement
          </button>
          {requirementError && (
            <p className="error-message">{requirementError}</p>
          )}
        </div>
      </section>

      <section className="data-section">
        <h2>Test Cases</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            {testCases.map((testCase) => (
              <tr key={testCase.test_case_id}>
                <td>{testCase.test_case_id}</td>
                <td>{testCase.title}</td>
                <td>{testCase.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="create-form">
          <h3>Add Test Case</h3>

          <div className="form-row">
            <div className="form-field small-field">
              <label>Test Case ID</label>
              <input
                type="text"
                placeholder="TC-001"
                value={newTestCaseId}
                onChange={(event) => {
                  setNewTestCaseId(event.target.value);
                  setTestCaseError("");
                }}
              />
            </div>

            <div className="form-field">
              <label>Title</label>
              <input
                type="text"
                placeholder="Successful login"
                value={newTestCaseTitle}
                onChange={(event) => setNewTestCaseTitle(event.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Description</label>
            <textarea
              placeholder="Describe the test case..."
              value={newTestCaseDescription}
              onChange={(event) =>
                setNewTestCaseDescription(event.target.value)
              }
            />
          </div>

          <button
            className="add-button"
            onClick={handleCreateTestCase}
            disabled={
              !newTestCaseId.trim() ||
              !newTestCaseTitle.trim() ||
              !newTestCaseDescription.trim()
            }
          >
            Add Test Case
          </button>
          {testCaseError && (
            <p className="error-message">{testCaseError}</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default DataPage;