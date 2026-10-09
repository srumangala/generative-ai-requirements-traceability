import "./Sidebar.css";

function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "requirements", label: "Requirements" },
    { id: "tests", label: "Test Cases" },
    { id: "traceability", label: "Traceability" },
    { id: "assistant", label: "Assistant" },
  ];

  return (
    <aside className="sidebar">
      <h2>Requirements AI</h2>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={
              activePage === item.id
                ? "sidebar-button active"
                : "sidebar-button"
            }
            onClick={() => setActivePage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;