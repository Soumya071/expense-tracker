import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import TransactionForm from "./TransactionForm.jsx";

const fmt = (n) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function Dashboard({ userName, onLogout }) {
  const [month, setMonth] = useState(currentMonth());
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, byCategory: [] });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const q = month ? `?month=${month}` : "";
      const [txns, sum] = await Promise.all([
        api(`/transactions${q}`),
        api(`/summary${q}`),
      ]);
      setTransactions(txns);
      setSummary(sum);
      setError("");
    } catch (err) {
      if (err.message.includes("token") || err.message.includes("Login")) onLogout();
      else setError(err.message);
    }
  }, [month, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id) {
    if (!confirm("Delete this transaction?")) return;
    try {
      await api(`/transactions/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const maxCat = Math.max(1, ...summary.byCategory.map((c) => c.total));

  return (
    <div className="container">
      <header className="topbar">
        <h1>💰 Expense Tracker</h1>
        <div>
          <span className="muted">Hi, {userName} </span>
          <button className="ghost" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="filter">
        <label>Month: </label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        {month && <button className="ghost" onClick={() => setMonth("")}>All time</button>}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="stats">
        <div className="card stat income"><span>Income</span><b>{fmt(summary.income)}</b></div>
        <div className="card stat expense"><span>Expenses</span><b>{fmt(summary.expense)}</b></div>
        <div className="card stat"><span>Balance</span><b className={summary.balance < 0 ? "neg" : ""}>{fmt(summary.balance)}</b></div>
      </div>

      <div className="grid">
        <TransactionForm onAdded={load} />

        <div className="card">
          <h3>Spending by category</h3>
          {summary.byCategory.length === 0 && <p className="muted">No expenses yet.</p>}
          {summary.byCategory.map((c) => (
            <div key={c.category} className="bar-row">
              <div className="bar-label"><span>{c.category}</span><span>{fmt(c.total)}</span></div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(c.total / maxCat) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Transactions</h3>
        {transactions.length === 0 && <p className="muted">Nothing here yet. Add your first transaction.</p>}
        <ul className="txn-list">
          {transactions.map((t) => (
            <li key={t.id}>
              <div>
                <b>{t.category}</b>
                <div className="muted small">{t.txn_date}{t.note ? ` · ${t.note}` : ""}</div>
              </div>
              <div className="txn-right">
                <span className={t.type === "income" ? "pos" : "neg"}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                </span>
                <button className="ghost danger" onClick={() => remove(t.id)}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
