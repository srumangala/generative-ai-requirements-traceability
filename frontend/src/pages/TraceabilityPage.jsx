import { useState } from "react";
import "./TraceabilityPage.css";

function TraceabilityPage() {
  const traceLinks = [
    {
      requirementId: "REQ-001",
      requirementText: "The system shall allow users to log in.",
      testCaseId: "TC-001",
      testCaseTitle: "Successful login",
      confidence: 0.96,
    },
    {
      requirementId: "REQ-001",
      requirementText: "The system shall allow users to log in.",
      testCaseId: "TC-002",
      testCaseTitle: "Invalid password",
      confidence: 0.89,
    },
    {
      requirementId: "REQ-002",
      requirementText: "The system shall respond within 2 seconds.",
      testCaseId: "TC-003",
      testCaseTitle: "Response time",
      confidence: 0.94,
    },
  ];

  const [selectedRequirement, setSelectedRequirement] = useState("");

  const filteredLinks = selectedRequirement
    ? traceLinks.filter(
        (link) => link.requirementId === selectedRequirement
      )
    : traceLinks;

  const requirementIds = [
    ...new Set(traceLinks.map((link) => link.requirementId)),
  ];

  return (
    <div className="traceability-page">
      <div className="traceability-header">
        <div>
          <h1>Traceability</h1>
          <p>
            Review links between requirements and test cases.
          </p>
        </div>

        <button className="primary-button">
          Suggest Trace Links with AI
        </button>
      </div>

      <div className="traceability-filter">
        <label htmlFor="requirement-filter">
          Filter by requirement
        </label>

        <select
          id="requirement-filter"
          value={selectedRequirement}
          onChange={(event) =>
            setSelectedRequirement(event.target.value)
          }
        >
          <option value="">All requirements</option>

          {requirementIds.map((requirementId) => (
            <option key={requirementId} value={requirementId}>
              {requirementId}
            </option>
          ))}
        </select>
      </div>

      <div className="trace-links-list">
        {filteredLinks.map((link) => (
          <div
            key={`${link.requirementId}-${link.testCaseId}`}
            className="trace-link-card"
          >
            <div className="trace-column">
              <span className="trace-label">Requirement</span>

              <strong>{link.requirementId}</strong>

              <p>{link.requirementText}</p>
            </div>

            <div className="trace-arrow">
              →
            </div>

            <div className="trace-column">
              <span className="trace-label">Test Case</span>

              <strong>{link.testCaseId}</strong>

              <p>{link.testCaseTitle}</p>
            </div>

            <div className="confidence">
              {Math.round(link.confidence * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TraceabilityPage;