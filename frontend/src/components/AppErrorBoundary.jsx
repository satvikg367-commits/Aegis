import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message ? String(error.message) : "Unknown client runtime error"
    };
  }

  componentDidCatch(error) {
    // Keep logs for production debugging without crashing UI.
    console.error("AppErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem", background: "#eef3fa", color: "#10243b" }}>
          <div style={{ maxWidth: 520, width: "100%", background: "#fff", border: "1px solid #c6d6e7", borderRadius: 12, padding: "1rem 1.1rem" }}>
            <h1 style={{ marginTop: 0 }}>AEGIS</h1>
            <p style={{ marginBottom: "0.8rem" }}>Something went wrong while loading this page.</p>
            {this.state.errorMessage && (
              <p style={{ marginTop: 0, marginBottom: "0.8rem", color: "#5a2f37", wordBreak: "break-word" }}>
                Error: {this.state.errorMessage}
              </p>
            )}
            <button type="button" onClick={() => window.location.reload()}>Reload Portal</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
