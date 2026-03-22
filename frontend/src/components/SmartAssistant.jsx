import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const starterPrompts = [
  "What is my pension status?",
  "Suggest jobs for me",
  "Help me file a healthcare claim",
  "Show CSD items I can order"
];

export default function SmartAssistant() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      title: "AEGIS Smart Assistance",
      answer: "I can help you with pension status, healthcare claims, job guidance, and CSD orders.",
      details: starterPrompts,
      actions: [],
      reminders: ["Secure assistant active", "Guided actions available across the portal"]
    }
  ]);

  const unreadCount = useMemo(
    () => messages.filter((message) => message.role === "assistant").length,
    [messages]
  );

  const askAssistant = async (question) => {
    const trimmed = String(question || "").trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: trimmed }
    ]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiRequest("/assistant/query", {
        method: "POST",
        token,
        body: { question: trimmed }
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          title: response.title,
          answer: response.answer,
          details: Array.isArray(response.details) ? response.details : [],
          actions: Array.isArray(response.actions) ? response.actions : [],
          reminders: Array.isArray(response.reminders) ? response.reminders : []
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          title: "Connection Issue",
          answer: error.message || "I could not reach the assistance service just now.",
          details: [],
          actions: [],
          reminders: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onAction = (action) => {
    if (action.path) {
      navigate(action.path);
      setIsOpen(false);
      return;
    }
    if (action.prompt) {
      askAssistant(action.prompt);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`assistant-trigger ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Open AEGIS Smart Assistant"
      >
        <span className="assistant-trigger-icon">AI</span>
        <span>Smart Assist</span>
        <span className="assistant-trigger-count">{unreadCount}</span>
      </button>

      {isOpen && (
        <aside className="assistant-panel" aria-label="AEGIS Smart Assistant Panel">
          <header className="assistant-panel-header">
            <div>
              <strong>AEGIS Smart Assistance</strong>
              <p>Guided support for pension, healthcare, career, and CSD.</p>
            </div>
            <button type="button" className="assistant-close" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </header>

          <div className="assistant-trust-row">
            <span className="trust-pill">Verified Guidance</span>
            <span className="trust-pill">Secure Session</span>
            <span className="trust-pill">Privacy Protected</span>
          </div>

          <div className="assistant-prompts">
            {starterPrompts.map((prompt) => (
              <button key={prompt} type="button" className="prompt-chip" onClick={() => askAssistant(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="assistant-feed">
            {messages.map((message) => (
              <article key={message.id} className={`assistant-message ${message.role}`}>
                {message.role === "user" ? (
                  <p>{message.text}</p>
                ) : (
                  <>
                    <strong>{message.title}</strong>
                    <p>{message.answer}</p>
                    {!!message.details?.length && (
                      <ul className="list compact">
                        {message.details.map((detail) => <li key={detail}>{detail}</li>)}
                      </ul>
                    )}
                    {!!message.actions?.length && (
                      <div className="assistant-actions">
                        {message.actions.map((action, index) => (
                          <button
                            key={`${action.label || action.prompt}-${index}`}
                            type="button"
                            className="assistant-action-btn"
                            onClick={() => onAction(action)}
                          >
                            {action.label || action.prompt}
                          </button>
                        ))}
                      </div>
                    )}
                    {!!message.reminders?.length && (
                      <div className="assistant-reminders">
                        {message.reminders.map((reminder) => (
                          <span key={reminder} className="assistant-reminder">{reminder}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>

          <form
            className="assistant-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              askAssistant(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about pension, claims, jobs, or CSD..."
            />
            <button type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Send"}
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
