import React from "react";
import ApiHealthCheck from "./ApiHealthCheck";
import SampleForm from "./components/SampleForm";

function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Student Budget Management – Dev</h1>

      <ApiHealthCheck />

      <SampleForm />
    </div>
  );
}

export default App;