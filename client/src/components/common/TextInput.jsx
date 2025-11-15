import React from "react";

function TextInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error,
}) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      {label && (
        <label
          htmlFor={name}
          style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}
        >
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          borderRadius: "4px",
          border: "1px solid #ccc",
          boxSizing: "border-box",
        }}
      />
      {error && (
        <div style={{ color: "red", fontSize: "0.8rem", marginTop: "0.25rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default TextInput;