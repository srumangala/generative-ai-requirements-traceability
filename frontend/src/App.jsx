import { useState } from "react";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import RequirementsPage from "./pages/RequirementsPage";
import TestCasesPage from "./pages/TestCasesPage";
import TraceabilityPage from "./pages/TraceabilityPage";
import AssistantPage from "./pages/AssistantPage";  

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="content">
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "requirements" && <RequirementsPage />}
        {activePage === "tests" && <TestCasesPage />}
        {activePage === "traceability" && <TraceabilityPage />}
        {activePage === "assistant" && <AssistantPage />}
      </main>
    </div>
  );
}

export default App;