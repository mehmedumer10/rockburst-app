// frontend/src/components/LoadingSpinner.js
import React from "react";

export default function LoadingSpinner({ fullScreen }) {
  if (fullScreen) {
    return (
      <div style={{
        minHeight:      "100vh",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        background:     "var(--gray-950)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width:        "48px",
            height:       "48px",
            border:       "3px solid rgba(37,99,235,0.2)",
            borderTop:    "3px solid #2563eb",
            borderRadius: "50%",
            animation:    "spin 0.8s linear infinite",
            margin:       "0 auto 1rem"
          }} />
          <p style={{ color: "#4b5563", fontSize: "0.9rem" }}>
            Loading RockburstAI...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return (
    <div className="spinner" style={{ margin: "0 auto" }} />
  );
}