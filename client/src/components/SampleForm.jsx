import React, { useState } from "react";
import TextInput from "./common/TextInput";
import PrimaryButton from "./common/PrimaryButton";

function SampleForm() {
  const [form, setForm] = useState({
    name: "",
    amount: "",
  });

  const [submitted, setSubmitted] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(form);
  }

  return (
    <div
      style={{
        marginTop: "2rem",
        padding: "1rem",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        maxWidth: "400px",
      }}
    >
      <h2>Sample Form (Reusable Inputs)</h2>
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter your name"
        />
        <TextInput
          label="Amount"
          name="amount"
          type="number"
          value={form.amount}
          onChange={handleChange}
          placeholder="Enter an amount"
        />

        <PrimaryButton type="submit">Submit</PrimaryButton>
      </form>

      {submitted && (
        <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          <strong>Last submitted values:</strong>
          <div>Name: {submitted.name}</div>
          <div>Amount: {submitted.amount}</div>
        </div>
      )}
    </div>
  );
}

export default SampleForm;