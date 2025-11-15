import React from "react";

function PrimaryButton({ children, ...rest }) {
  return (
    <button
      {...rest}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "4px",
        border: "none",
        backgroundColor: "#2563eb",
        color: "white",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;