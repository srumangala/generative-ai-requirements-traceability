import { useEffect, useRef, useState } from "react";
import "./RequirementsPage.css";

function RequirementsPage() {
  const analysisSelectRef = useRef(null);
  const selectAllRef = useRef(null);
  const [requirements, setRequirements] = useState([]);
  const [requirementsFile, setRequirementsFile] = useState(null);
  const [newRequirementId, setNewRequirementId] = useState("");
  const [newRequirementDescription, setNewRequirementDescription] = useState("");
  const [requirementError, setRequirementError] = useState("");
  const [requirementsUploadMessage, setRequirementsUploadMessage] = useState("");
  const [selectedRequirementId, setSelectedRequirementId] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [batchAnalysisMessage, setBatchAnalysisMessage] = useState("");
  const selectedRequirement = requirements.find(
    (requirement) => requirement.requirement_id === selectedRequirementId
  );

  useEffect(() => {
    fetch("http://localhost:8000/requirements")
      .then((response) => response.json())
      .then((data) => setRequirements(data))
      .catch((error) => console.error("Failed to load requirements:", error));
  }, []);

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

  const selectedBatchRequirements = requirements.filter((requirement) =>
    selectedBatchIds.includes(requirement.requirement_id)
  );
  const allSelected = requirements.length > 0 && selectedBatchRequirements.length === requirements.length;
  const partiallySelected = selectedBatchRequirements.length > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

  function handleBatchSelection(requirementId) {
    setSelectedBatchIds((currentIds) => currentIds.includes(requirementId)
      ? currentIds.filter((id) => id !== requirementId)
      : [...currentIds, requirementId]);
    setBatchAnalysisMessage("");
  }

  function handleSelectAll() {
    setSelectedBatchIds(allSelected ? [] : requirements.map((requirement) => requirement.requirement_id));
    setBatchAnalysisMessage("");
  }

  function handleAnalyseSelectedRequirements() {
    if (selectedBatchRequirements.length === 0) return;
    // Connect the batch API here, sending selectedBatchRequirements.map(item => item.requirement_id).
    setBatchAnalysisMessage("AI analysis is not available yet.");
  }

  function handleAnalyseRequirement(requirementId) {
    // Connect the analysis API here when available; both buttons use this handler.
    setSelectedRequirementId(requirementId);
    analysisSelectRef.current?.focus({ preventScroll: true });
    analysisSelectRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleDeleteRequirement(requirementId) {
    const confirmed = window.confirm(
      "Do you really want to delete this requirement?"
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `http://localhost:8000/requirements/${requirementId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      console.error("Failed to delete requirement");
      return;
    }

    setSelectedBatchIds((currentIds) => currentIds.filter((id) => id !== requirementId));
    setSelectedRequirementId((currentId) => currentId === requirementId ? "" : currentId);
    setBatchAnalysisMessage("");
    setRequirements((currentRequirements) =>
      currentRequirements.filter(
        (requirement) =>
          requirement.requirement_id !== requirementId
      )
    );
  }

  return (
    <div className="requirements-page">
      <h1>Requirements Analysis</h1>

      <div className="requirement-selector">
        <label htmlFor="requirement-select">
          Select a requirement
        </label>

        <select
          id="requirement-select"
          ref={analysisSelectRef}
          value={selectedRequirementId}
          onChange={(event) =>
            setSelectedRequirementId(event.target.value)
          }
        >
          <option value="">Choose a requirement</option>

          {requirements.map((requirement) => (
            <option key={requirement.requirement_id} value={requirement.requirement_id}>
              {requirement.requirement_id}
            </option>
          ))}
        </select>
      </div>

      {selectedRequirement && (
        <>
          <div className="requirement-card">
            <h3>{selectedRequirement.requirement_id}</h3>
            <p>{selectedRequirement.description}</p>
          </div>
          <div className="requirement-actions">
            <button
              disabled={!selectedRequirement}
              onClick={() => handleAnalyseRequirement(selectedRequirementId)}
            >
              Analyse with AI
            </button>

            <button disabled={!selectedRequirement}>
              Generate Test Cases
            </button>
          </div>
        </>
      )}

      <section className="data-section">
        <h2>Requirements</h2>
        <div className="requirements-toolbar">
          <span className="selection-count" role="status">
            {selectedBatchRequirements.length} selected
          </span>
          <button
            onClick={handleAnalyseSelectedRequirements}
            disabled={selectedBatchRequirements.length === 0}
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
                    aria-label="Select all requirements"
                    checked={allSelected}
                    disabled={requirements.length === 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>Requirement</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {requirements.map((requirement) => (
                <tr
                  key={requirement.requirement_id}
                  className={selectedBatchIds.includes(requirement.requirement_id) ? "is-selected" : ""}
                >
                  <td className="selection-column">
                    <input
                      type="checkbox"
                      aria-label={`Select requirement ${requirement.requirement_id}`}
                      checked={selectedBatchIds.includes(requirement.requirement_id)}
                      onChange={() => handleBatchSelection(requirement.requirement_id)}
                    />
                  </td>
                  <td>{requirement.requirement_id}</td>
                  <td>{requirement.description}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="analyse-button"
                        onClick={() => handleAnalyseRequirement(requirement.requirement_id)}
                      >
                        Analyse
                      </button>
                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDeleteRequirement(
                            requirement.requirement_id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

          <div className="form-divider">
            <span>or upload CSV</span>
          </div>

          <div className="upload-inline">
            <input
              type="file"
              accept=".csv"
              onChange={(event) =>
                setRequirementsFile(event.target.files[0])
              }
            />

            <button
              className="upload-button"
              onClick={handleRequirementsUpload}
              disabled={!requirementsFile}
            >
              Upload
            </button>
          </div>

          {requirementsUploadMessage && (
            <p className="upload-message">
              {requirementsUploadMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default RequirementsPage;
