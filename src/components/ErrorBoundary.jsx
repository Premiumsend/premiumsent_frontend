import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#ececec" }}>
          <h2>Oops, nimadir xato ketdi!</h2>
          <p>{this.state.error?.message}</p>
          <button 
            style={{ padding: "10px 20px", marginTop: "10px", borderRadius: "10px", background: "#3390ec", color: "white", border: "none" }}
            onClick={() => window.location.reload()}
          >
            Qayta yuklash
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
