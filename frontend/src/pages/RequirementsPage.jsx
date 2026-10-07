import { useEffect, useState } from "react";
import "./RequirementsPage.css";

function RequirementsPage() {
  const [requirements, setRequirements] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/requirements")
      .then((response) => response.json())
      .then((data) => setRequirements(data))
      .catch((error) => console.error("Failed to load requirements:", error));
  }, []);

  const [selectedRequirementId, setSelectedRequirementId] = useState("");

  const selectedRequirement = requirements.find(
    (requirement) => requirement.id === selectedRequirementId
  );


  return (
    <div className="requirements-page">
      <h1>Requirements Analysis</h1>

      <div className="requirement-selector">
        <label htmlFor="requirement-select">
          Select a requirement
        </label>

        <select
          id="requirement-select"
          value={selectedRequirementId}
          onChange={(event) =>
            setSelectedRequirementId(event.target.value)
          }
        >
          <option value="">Choose a requirement</option>

          {requirements.map((requirement) => (
            <option key={requirement.id} value={requirement.id}>
              {requirement.id}
            </option>
          ))}
        </select>
      </div>

      {selectedRequirement && (
        <div className="requirement-card">
          <h2>{selectedRequirement.id}</h2>
          <p>{selectedRequirement.text}</p>
        </div>
      )}

      <div className="requirement-actions">
        <button disabled={!selectedRequirement}>
          Analyse with AI
        </button>

        <button disabled={!selectedRequirement}>
          Generate Test Cases
        </button>
      </div>
    </div>
  );
}

export default RequirementsPage;