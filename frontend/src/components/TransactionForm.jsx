import { useState } from "react";
import { api } from "../api";

const CATEGORIES = {
  expense: ["Food", "Travel", "Rent", "Shopping", "Bills", "Health", "Entertainment", "Other"],
  income: ["Salary", "Pocket Money", "Freelance", "Gift", "Other"],
};

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionForm({ onAdded }) {
  const [form, setForm] = useState({
    type: "expense",
    category: "Food",
    amount: "",
    note: "",
    txn_date: today(),
  });
  const [error, setError] = useState("");

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function changeType(type) {
    setForm({ ...form, type, category: CATEGORIES[type][0] });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/transactions", { method: "POST", body: form });
      setForm({ ...form, amount: "", note: "" });
      onAdded();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>Add transaction</h3>

      <div className="toggle">
        <button type="button" className={form.type === "expense" ? "active" : ""} onClick={() => changeType("expense")}>Expense</button>
        <button type="button" className={form.type === "income" ? "active" : ""} onClick={() => changeType("income")}>Income</button>
      </div>

      <select name="category" value={form.category} onChange={update}>
        {CATEGORIES[form.type].map((c) => <option key={c}>{c}</option>)}
      </select>
      <input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount (₹)" value={form.amount} onChange={update} required />
      <input name="txn_date" type="date" value={form.txn_date} onChange={update} required />
      <input name="note" placeholder="Note (optional)" value={form.note} onChange={update} maxLength={255} />

      {error && <div className="error">{error}</div>}
      <button type="submit">Add</button>
    </form>
  );
}
