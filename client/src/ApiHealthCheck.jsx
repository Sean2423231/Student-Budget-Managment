import React, { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

function ApiHealthCheck() {
  const [status, setStatus] = useState("Loading...");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setStatus(data.status || "unknown");
        setMessage(data.message || "");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("Failed to reach backend");
      }
    }

    checkHealth();
  }, []);

  return (
    <div style={{ padding: "1rem", border: "1px solid lightgray", borderRadius: "8px" }}>
      <h2>Backend Connection Status</h2>
      <p><strong>Status:</strong> {status}</p>
      {message && <p><strong>Message:</strong> {message}</p>}
    </div>
  );
}

export default ApiHealthCheck;