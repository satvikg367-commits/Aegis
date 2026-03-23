import { useEffect, useMemo, useRef, useState } from "react";
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
  const [showPrompts, setShowPrompts] = useState(true);
  const feedRef = useRef(null);
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
  const hasConversation = useMemo(
    () => loading || messages.some((message) => message.role === "user"),
    [loading, messages]
  );

  useEffect(() => {
    if (!isOpen || !feedRef.current) return;

    const timer = window.setTimeout(() => {
      feedRef.current?.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: "smooth"
      });
    }, 40);

    return () => window.clearTimeout(timer);
  }, [isOpen, loading, messages]);

  const askAssistant = async (question) => {
    const trimmed = String(question || "").trim();
    if (!trimmed) return;

    setShowPrompts(false);
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
        <aside
          className={`assistant-panel ${hasConversation ? "has-results" : ""}`}
          aria-label="AEGIS Smart Assistant Panel"
        >
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
            {hasConversation && (
              <button
                type="button"
                className="assistant-chip-toggle"
                onClick={() => setShowPrompts((value) => !value)}
              >
                {showPrompts ? "Hide quick prompts" : "Show quick prompts"}
              </button>
            )}
          </div>

          {(!hasConversation || showPrompts) && (
            <div className="assistant-prompts">
              {starterPrompts.map((prompt) => (
                <button key={prompt} type="button" className="prompt-chip" onClick={() => askAssistant(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div ref={feedRef} className="assistant-feed">
            {messages.map((message) => (
              <article key={message.id} className={`assistant-message ${message.role}`}>
                {message.role === "user" ? (
                  <p>{message.text}</p>
                ) : (
                  <>
                    <strong>{message.title}</strong>
                    <p>{message.answer}</p>
                    {!(message.id === "welcome" && hasConversation) && !!message.details?.length && (
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
                    {!(message.id === "welcome" && hasConversation) && !!message.reminders?.length && (
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
            {loading && (
              <article className="assistant-message assistant thinking">
                <strong>Working on it</strong>
                <p>Preparing the best next step for you.</p>
              </article>
            )}
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
