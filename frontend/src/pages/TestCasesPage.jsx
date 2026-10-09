import { useEffect, useState } from "react";
import "./TestCasesPage.css";

function TestCasesPage() {
  const [testCasesFile, setTestCasesFile] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [newTestCaseId, setNewTestCaseId] = useState("");
  const [newTestCaseTitle, setNewTestCaseTitle] = useState("");
  const [newTestCaseDescription, setNewTestCaseDescription] = useState("");
  const [testCaseError, setTestCaseError] = useState("");
  const [testCasesUploadMessage, setTestCasesUploadMessage] = useState("");

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

  async function handleDeleteTestCase(testCaseId) {
    const confirmed = window.confirm(
      "Do you really want to delete this test case?"
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `http://localhost:8000/test-cases/${testCaseId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      console.error("Failed to delete test case");
      return;
    }

    setTestCases((currentTestCases) =>
      currentTestCases.filter(
        (testCase) =>
          testCase.test_case_id !== testCaseId
      )
    );
  }

  useEffect(() => {
    fetch("http://localhost:8000/test-cases")
      .then((response) => response.json())
      .then((data) => setTestCases(data))
      .catch((error) => console.error("Failed to load test cases:", error));
  }, []);


  const [selectedTestCaseId, setSelectedTestCaseId] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);

  const selectedTestCase = testCases.find(
    (testCase) => testCase.test_case_id === selectedTestCaseId
  );

  function handleBatchSelection(testCaseId) {
    if (selectedBatchIds.includes(testCaseId)) {
      setSelectedBatchIds(
        selectedBatchIds.filter((id) => id !== testCaseId)
      );
    } else {
      setSelectedBatchIds([...selectedBatchIds, testCaseId]);
    }
  }

  return (
    <div className="test-cases-page">
      <h1>Test Case Analysis</h1>

      <section className="single-analysis-section">
        <h2>Improve a Test Case</h2>

        <div className="test-case-selector">
          <label htmlFor="test-case-select">
            Select a test case
          </label>

          <select
            id="test-case-select"
            value={selectedTestCaseId}
            onChange={(event) =>
              setSelectedTestCaseId(event.target.value)
            }
          >
            <option value="">Choose a test case</option>

            {testCases.map((testCase) => (
              <option key={testCase.test_case_id} value={testCase.test_case_id}>
                {testCase.test_case_id} - {testCase.title}
              </option>
            ))}
          </select>
        </div>

        {selectedTestCase && (
          <>
            <div className="test-case-card">
              <h3>{selectedTestCase.test_case_id}</h3>
              <strong>{selectedTestCase.title}</strong>
              <p>{selectedTestCase.description}</p>
            </div>
            <div className="test-case-actions">
              <button disabled={!selectedTestCase}>
                Improve with AI
              </button>
            </div>
          </>
        )}
      </section>

      <section className="data-section">
        <h2>Test Cases</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {testCases.map((testCase) => (
              <tr key={testCase.test_case_id}>
                <td>{testCase.test_case_id}</td>
                <td>{testCase.title}</td>
                <td>{testCase.description}</td>

                <td>
                  <button
                    className="delete-button"
                    onClick={() =>
                      handleDeleteTestCase(testCase.test_case_id)
                    }
                  >
                    Delete
                  </button>
                </td>
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

          <div className="form-divider">
            <span>or upload CSV</span>
          </div>

          <div className="upload-inline">
            <input
              type="file"
              accept=".csv"
              onChange={(event) =>
                setTestCasesFile(event.target.files[0])
              }
            />

            <button
              className="upload-button"
              onClick={handleTestCasesUpload}
              disabled={!testCasesFile}
            >
              Upload
            </button>
          </div>

          {testCasesUploadMessage && (
            <p className="upload-message">
              {testCasesUploadMessage}
            </p>
          )}
        </div>

      </section>
      <section className="batch-analysis-section">
        <h2>Batch Analysis</h2>

        <p>
          Select multiple test cases to analyse and improve together.
        </p>

        <div className="test-case-list">
          {testCases.map((testCase) => (
            <label
              key={testCase.test_case_id}
              className="test-case-row"
            >
              <input
                type="checkbox"
                checked={selectedBatchIds.includes(testCase.test_case_id)}
                onChange={() =>
                  handleBatchSelection(testCase.test_case_id)
                }
              />

              <div>
                <strong>
                  {testCase.test_case_id} - {testCase.title}
                </strong>
                <p>{testCase.description}</p>
              </div>
            </label>
          ))}
        </div>

        <button
          className="primary-button"
          disabled={selectedBatchIds.length === 0}
        >
          Analyse Selected Test Cases
        </button>
      </section>
    </div>
  );
}

export default TestCasesPage;