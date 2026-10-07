import { useState } from "react";
import "./AssistantPage.css";

function AssistantPage() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! Ask me anything about your requirements, test cases, or trace links.",
    },
  ]);

  function handleSend() {
    if (!message.trim()) {
      return;
    }

    const newMessage = {
      role: "user",
      text: message,
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  }

  return (
    <div className="assistant-page">
      <h1>AI Assistant</h1>

      <p className="assistant-description">
        Ask questions about your requirements, test cases, and traceability data.
      </p>

      <div className="chat-window">
        {messages.map((chatMessage, index) => (
          <div
            key={index}
            className={`chat-message ${chatMessage.role}`}
          >
            <span className="chat-role">
              {chatMessage.role === "user" ? "You" : "Assistant"}
            </span>

            <p>{chatMessage.text}</p>
          </div>
        ))}
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          value={message}
          placeholder="Ask a question..."
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSend();
            }
          }}
        />

        <button onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}

export default AssistantPage;