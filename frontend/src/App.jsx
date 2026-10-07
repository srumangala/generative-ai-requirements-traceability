import { useState } from "react";

import Sidebar from "./components/Sidebar";

import DataPage from "./pages/Datapage";
import RequirementsPage from "./pages/RequirementsPage";
import TestCasesPage from "./pages/TestCasesPage";
import TraceabilityPage from "./pages/TraceabilityPage";
import AssistantPage from "./pages/AssistantPage";  

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("data");

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="content">
        {activePage === "data" && <DataPage />}
        {activePage === "requirements" && <RequirementsPage />}
        {activePage === "tests" && <TestCasesPage />}
        {activePage === "traceability" && <TraceabilityPage />}
        {activePage === "assistant" && <AssistantPage />}
      </main>
    </div>
  );
}

export default App;