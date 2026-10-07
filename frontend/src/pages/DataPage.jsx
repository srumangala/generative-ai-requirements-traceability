import { useEffect, useState } from "react";
import "./DataPage.css";

function DataPage() {
  const [requirementsFile, setRequirementsFile] = useState(null);
  const [testCasesFile, setTestCasesFile] = useState(null);

  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);

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
              <tr key={requirement.id}>
                <td>{requirement.id}</td>
                <td>{requirement.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="data-section">
        <h2>Test Cases</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Test Case</th>
            </tr>
          </thead>

          <tbody>
            {testCases.map((testCase) => (
              <tr key={testCase.id}>
                <td>{testCase.id}</td>
                <td>{testCase.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default DataPage;