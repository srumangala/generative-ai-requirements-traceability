import { useEffect, useState } from "react";
import "./TestCasesPage.css";

function TestCasesPage() {

  const [testCases, setTestCases] = useState([]);
  
  useEffect(() => {
    fetch("http://localhost:8000/test-cases")
      .then((response) => response.json())
      .then((data) => setTestCases(data))
      .catch((error) => console.error("Failed to load test cases:", error));
  }, []);

  const [selectedTestCaseId, setSelectedTestCaseId] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);

  const selectedTestCase = testCases.find(
    (testCase) => testCase.id === selectedTestCaseId
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
              <option key={testCase.id} value={testCase.id}>
                {testCase.id} - {testCase.title}
              </option>
            ))}
          </select>
        </div>

        {selectedTestCase && (
          <div className="test-case-card">
            <h3>{selectedTestCase.id}</h3>
            <strong>{selectedTestCase.title}</strong>
            <p>{selectedTestCase.description}</p>
          </div>
        )}

        <button
          className="primary-button"
          disabled={!selectedTestCase}
        >
          Improve with AI
        </button>
      </section>

      <section className="batch-analysis-section">
        <h2>Batch Analysis</h2>

        <p>
          Select multiple test cases to analyse and improve together.
        </p>

        <div className="test-case-list">
          {testCases.map((testCase) => (
            <label
              key={testCase.id}
              className="test-case-row"
            >
              <input
                type="checkbox"
                checked={selectedBatchIds.includes(testCase.id)}
                onChange={() =>
                  handleBatchSelection(testCase.id)
                }
              />

              <div>
                <strong>
                  {testCase.id} - {testCase.title}
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