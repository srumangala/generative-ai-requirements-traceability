import { Fragment, useEffect, useRef, useState } from "react";
import "./RequirementsPage.css";


function RequirementsPage() {
  const selectAllRef = useRef(null);
  const [requirements, setRequirements] = useState([]);
  const [requirementsFile, setRequirementsFile] = useState(null);
  const [newRequirementId, setNewRequirementId] = useState("");
  const [newRequirementDescription, setNewRequirementDescription] = useState("");
  const [requirementError, setRequirementError] = useState("");
  const [requirementsUploadMessage, setRequirementsUploadMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [batchAnalysisMessage, setBatchAnalysisMessage] = useState("");
  const [requirementAnalyses, setRequirementAnalyses] = useState({});
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [testCaseGeneration, setTestCaseGeneration] = useState({});

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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRequirements = requirements.filter((requirement) =>
    requirement.requirement_id.toLowerCase().includes(normalizedQuery) ||
    (requirement.description || "").toLowerCase().includes(normalizedQuery)
  );
  const selectedBatchRequirements = requirements.filter((requirement) =>
    selectedBatchIds.includes(requirement.requirement_id)
  );
  const visibleSelectedCount = filteredRequirements.filter((requirement) =>
    selectedBatchIds.includes(requirement.requirement_id)
  ).length;
  const hiddenSelectedCount = selectedBatchRequirements.length - visibleSelectedCount;
  const allSelected = filteredRequirements.length > 0 && visibleSelectedCount === filteredRequirements.length;
  const partiallySelected = visibleSelectedCount > 0 && !allSelected;

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
    const visibleIds = filteredRequirements.map((requirement) => requirement.requirement_id);
    setSelectedBatchIds((currentIds) => allSelected
      ? currentIds.filter((id) => !visibleIds.includes(id))
      : [...new Set([...currentIds, ...visibleIds])]);
    setBatchAnalysisMessage("");
  }

  async function handleAnalyseSelectedRequirements() {
    if (selectedBatchRequirements.length === 0 || isAnalysing) return;
    setIsAnalysing(true);
    try {
      const response = await fetch(
        `http://localhost:8000/requirements/analyse-batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requirement_ids: selectedBatchRequirements.map(
              (requirement) => requirement.requirement_id
            ),
          }),
        }
      );
      if (!response.ok) {
        console.error("Failed to analyse selected requirements");
        return;
      }

      const batchAnalysis = await response.json();

      setRequirementAnalyses((current) => {
        const updated = { ...current };

        batchAnalysis.results.forEach((analysis) => {
          updated[analysis.requirement_id] = analysis;
        });

        return updated;
      });
    } catch (error) {
      console.error(error);
      setBatchAnalysisMessage("Batch analysis failed. Please try again.");
    } finally {
      setIsAnalysing(false);
    }
  }

  async function handleAnalyseRequirement(requirementId) {

    if (isAnalysing) return;
    setIsAnalysing(true);

    try {
      const response = await fetch(
        `http://localhost:8000/requirements/${requirementId}/analyse`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        console.error("Failed to analyse requirement");
        return;
      }

      const analysis = await response.json();

      setRequirementAnalyses((current) => ({
        ...current,
        [requirementId]: analysis,
      }));

    } catch (error) {
      console.error(error);
      setBatchAnalysisMessage("Analysis failed. Please try again.");
    } finally {
      setIsAnalysing(false);
    }
  }

  async function handleSaveGeneratedTestCase(testCase, requirementId, testCaseIndex) {
    const response = await fetch(
      "http://localhost:8000/test-cases",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: testCase.title,
          description: testCase.description,
          prerequisites: testCase.prerequisites,
          steps: testCase.steps,
          expected_result: testCase.expected_result,
          related_requirement: requirementId
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(errorData);
      return;
    }

    const createdTestCase = await response.json();
    setTestCaseGeneration((current) => {
      const updatedTestCases =
        current[requirementId].generated_test_cases.map(
          (generatedTestCase, index) => {
            if (index === testCaseIndex) {
              return {
                ...generatedTestCase,
                status: "accepted",
                test_case_id: createdTestCase.test_case_id,
              };
            }

            return generatedTestCase;
          }
        );

      return {
        ...current,
        [requirementId]: {
          ...current[requirementId],
          generated_test_cases: updatedTestCases,
        },
      };
    });

    console.log("Saved:", createdTestCase);
  }

  function handleRejectGeneratedTestCase(requirementId, testCaseIndex) {
    setTestCaseGeneration((current) => {
      const updatedTestCases =
        current[requirementId].generated_test_cases.map(
          (testCase, index) => {
            if (index === testCaseIndex) {
              return {
                ...testCase,
                status: "rejected",
              };
            }

            return testCase;
          }
        );

      return {
        ...current,
        [requirementId]: {
          ...current[requirementId],
          generated_test_cases: updatedTestCases,
        },
      };
    });
  }

  async function handleGenerateTestCases(requirementId) {
    if (isAnalysing) return;
    setIsAnalysing(true);
    try {
      const response = await fetch(
        `http://localhost:8000/requirements/${requirementId}/generate-test-cases`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        console.error("Failed to generate test cases");
        return;
      }
      const result = await response.json();

      setTestCaseGeneration((current) => ({
        ...current,
        [requirementId]: result,
      }));

    } catch (error) {
      console.error(error);
      setBatchAnalysisMessage("Test Case Generation failed. Please try again.");
    } finally {
      setIsAnalysing(false);
    }
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
      {isAnalysing && (
        <div className="loading-overlay">
          <div
            className="loading-modal"
            role="status"
            aria-live="polite"
          >
            <div className="loading-spinner"></div>

            <h3>Analysing</h3>

            <p>
              AI is generating.
              Please wait...
            </p>
          </div>
        </div>
      )}
      <h1>Requirements Analysis</h1>

      <section className="data-section">
        <h2>Requirements</h2>
        <div className="requirements-search">
          <label htmlFor="requirements-search">Search requirements</label>
          <input
            id="requirements-search"
            type="search"
            placeholder="Search by requirement ID or description..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setBatchAnalysisMessage("");
            }}
          />
          <span className="search-results-count" role="status">
            {filteredRequirements.length} of {requirements.length} requirements
          </span>
        </div>
        <div className="requirements-toolbar">
          <span className="selection-count" role="status">
            {selectedBatchRequirements.length} selected
            {hiddenSelectedCount > 0 && ` (${hiddenSelectedCount} hidden by search)`}
          </span>
          <button
            onClick={handleAnalyseSelectedRequirements}
            disabled={selectedBatchRequirements.length === 0 || isAnalysing}
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
                    aria-label="Select all matching requirements"
                    checked={allSelected}
                    disabled={filteredRequirements.length === 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>Requirement</th>
                <th className="analysis-column">Analyse</th>
                <th className="generation-column">Generate Test Cases</th>
                <th className="delete-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequirements.map((requirement) => {
                const analysis = requirementAnalyses[requirement.requirement_id];
                const generatedTestCases = testCaseGeneration[requirement.requirement_id];
                return (
                  <>
                    <tr>
                      <td className="selection-column">
                        <input
                          type="checkbox"
                          checked={selectedBatchIds.includes(
                            requirement.requirement_id
                          )}
                          onChange={() => handleBatchSelection(requirement.requirement_id)}
                        />
                      </td>
                      <td>{requirement.requirement_id}</td>
                      <td>{requirement.description}</td>
                      <td className="analysis-column">
                        <button
                          className="analyse-button"
                          onClick={() => handleAnalyseRequirement(requirement.requirement_id)}
                          disabled={isAnalysing}
                        >
                          Analyse
                        </button>
                      </td>

                      <td className="generation-column">
                        <button
                          className="generate-button"
                          onClick={() => handleGenerateTestCases(requirement.requirement_id)}
                          disabled={isAnalysing}
                        >
                          Generate Test Cases
                        </button>
                      </td>

                      <td className="delete-column">
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
                      </td>
                    </tr>

                    {analysis && (
                      <tr className="analysis-expanded-row">
                        <td colSpan={6}>
                          <div className="analysis-panel">
                            <h3>AI Analysis</h3>

                            <p>{analysis.analysis}</p>

                            <span className="analysis-score">
                              Overall Score: {analysis.confidence}
                            </span>

                            <div className="analysis-issues">
                              {analysis.issues.map((issue) => (
                                <div
                                  className="analysis-issue"
                                  key={issue.category}
                                >
                                  <div className="analysis-issue-header">
                                    <strong>{issue.category}</strong>

                                    <span className="analysis-issue-score">
                                      {issue.score}/100
                                    </span>
                                  </div>

                                  <p>{issue.description}</p>
                                </div>
                              ))}
                            </div>

                            {analysis.suggestion && (
                              <div className="analysis-suggestion">
                                <h4>Suggested Revision</h4>
                                <p>{analysis.suggestion}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {generatedTestCases && (
                      <tr className="generated-tests-expanded-row">
                        <td colSpan={6}>
                          <div className="generated-tests-panel">
                            <h3>Generated Test Cases</h3>

                            {generatedTestCases.generated_test_cases.map((testCase, index) => (
                              <div
                                className="generated-test-case"
                                key={index}
                              >
                                <div className="generated-test-header">
                                  <strong>TC-00{index+1}</strong>
                                  <span>{testCase.title}</span>
                                </div>
                                <div className="test-case-section">
                                  <h4>Description</h4>
                                  <p>{testCase.description}</p>
                                </div>

                                <div className="test-case-section">
                                  <h5>Prerequisites</h5>
                                  <div className="test-case-steps">
                                    {testCase.prerequisites.map((step, index) => (
                                      <p key={index}>{step}</p>
                                    ))}
                                  </div>
                                </div>

                                <div className="test-case-section">
                                  <h5>Steps</h5>

                                  <div className="test-case-steps">
                                    {testCase.steps.map((step, index) => (
                                      <p key={index}>{step}</p>
                                    ))}
                                  </div>
                                </div>

                                <div className="test-case-section">
                                  <h5>Expected Result</h5>
                                  <p>{testCase.expected_result}</p>
                                </div>
                                <div className="test-case-accept-reject-section">
                                  <button
                                    className="accept-test-case-button"
                                    disabled={
                                      testCase.status === "accepted" ||
                                      testCase.status === "rejected"
                                    }
                                    onClick={() => handleSaveGeneratedTestCase(testCase, requirement.requirement_id, index)}
                                  >
                                    {testCase.status === "accepted" ? "Accepted" : "Accept"}
                                  </button>
                                  <button
                                    className="reject-test-case-button"
                                    disabled={
                                      testCase.status === "accepted" ||
                                      testCase.status === "rejected"
                                    }
                                    onClick={() => handleRejectGeneratedTestCase(requirement.requirement_id,
                                      index)}
                                  >
                                    {testCase.status === "rejected" ? "Rejected" : "Reject"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {filteredRequirements.length === 0 && (
                <tr>
                  <td colSpan={6} className="requirements-empty">
                    {normalizedQuery ? "No requirements match your search." : "No requirements available."}
                  </td>
                </tr>
              )}
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
