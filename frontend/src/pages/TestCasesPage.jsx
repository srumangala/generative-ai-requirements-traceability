import { useEffect, useRef, useState } from "react";
import "./TestCasesPage.css";

function TestCasesPage() {
  const selectAllRef = useRef(null);
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

  function handleAnalyseTestCase(testCaseId) {
    // Connect the individual analysis API here, using testCaseId.
    setBatchAnalysisMessage(`AI analysis for ${testCaseId} is not available yet.`);
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

    setSelectedBatchIds((currentIds) => currentIds.filter((id) => id !== testCaseId));
    setBatchAnalysisMessage("");
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


  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [batchAnalysisMessage, setBatchAnalysisMessage] = useState("");


  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTestCases = testCases.filter((testCase) =>
    testCase.test_case_id.toLowerCase().includes(normalizedQuery) ||
    (testCase.title || "").toLowerCase().includes(normalizedQuery) ||
    (testCase.description || "").toLowerCase().includes(normalizedQuery)
  );
  const selectedBatchCases = testCases.filter((testCase) =>
    selectedBatchIds.includes(testCase.test_case_id)
  );
  const visibleSelectedCount = filteredTestCases.filter((testCase) =>
    selectedBatchIds.includes(testCase.test_case_id)
  ).length;
  const hiddenSelectedCount = selectedBatchCases.length - visibleSelectedCount;
  const allSelected = filteredTestCases.length > 0 && visibleSelectedCount === filteredTestCases.length;
  const partiallySelected = visibleSelectedCount > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

  function handleBatchSelection(testCaseId) {
    setSelectedBatchIds((currentIds) => currentIds.includes(testCaseId)
      ? currentIds.filter((id) => id !== testCaseId)
      : [...currentIds, testCaseId]);
    setBatchAnalysisMessage("");
  }

  function handleSelectAll() {
    const visibleIds = filteredTestCases.map((testCase) => testCase.test_case_id);
    setSelectedBatchIds((currentIds) => allSelected
      ? currentIds.filter((id) => !visibleIds.includes(id))
      : [...new Set([...currentIds, ...visibleIds])]);
    setBatchAnalysisMessage("");
  }

  function handleAnalyseSelectedTestCases() {
    if (selectedBatchCases.length === 0) return;
    // Connect the batch API here, sending selectedBatchCases.map(item => item.test_case_id).
    setBatchAnalysisMessage("AI analysis is not available yet.");
  }

  return (
    <div className="test-cases-page">
      <h1>Test Case Analysis</h1>

      <section className="data-section">
        <h2>Test Cases</h2>
        <div className="test-cases-search">
          <label htmlFor="test-cases-search">Search test cases</label>
          <input
            id="test-cases-search"
            type="search"
            placeholder="Search by test case ID, title, or description..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setBatchAnalysisMessage("");
            }}
          />
          <span className="search-results-count" role="status">
            {filteredTestCases.length} of {testCases.length} test cases
          </span>
        </div>
        <div className="test-cases-toolbar">
          <span className="selection-count" role="status">
            {selectedBatchCases.length} selected
            {hiddenSelectedCount > 0 && ` (${hiddenSelectedCount} hidden by search)`}
          </span>
          <button
            onClick={handleAnalyseSelectedTestCases}
            disabled={selectedBatchCases.length === 0}
          >
            Analyse with AI
          </button>
        </div>
        {batchAnalysisMessage && (
          <p className="batch-analysis-message" role="status">{batchAnalysisMessage}</p>
        )}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="selection-column">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all matching test cases"
                    checked={allSelected}
                    disabled={filteredTestCases.length === 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTestCases.map((testCase) => (
                <tr
                  key={testCase.test_case_id}
                  className={selectedBatchIds.includes(testCase.test_case_id) ? "is-selected" : ""}
                >
                  <td className="selection-column">
                    <input
                      type="checkbox"
                      aria-label={`Select test case ${testCase.test_case_id}`}
                      checked={selectedBatchIds.includes(testCase.test_case_id)}
                      onChange={() => handleBatchSelection(testCase.test_case_id)}
                    />
                  </td>
                  <td>{testCase.test_case_id}</td>
                  <td>{testCase.title}</td>
                  <td>{testCase.description}</td>

                  <td>
                    <div className="table-actions">
                      <button
                        className="analyse-button"
                        onClick={() => handleAnalyseTestCase(testCase.test_case_id)}
                      >
                        Analyse
                      </button>
                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDeleteTestCase(testCase.test_case_id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTestCases.length === 0 && (
                <tr>
                  <td colSpan={5} className="test-cases-empty">
                    {normalizedQuery ? "No test cases match your search." : "No test cases available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
    </div>
  );
}

export default TestCasesPage;
