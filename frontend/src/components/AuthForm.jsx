import { useState } from "react";
import { api } from "../api";

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api(`/auth/${mode}`, { method: "POST", body: form });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1>💰 Expense Tracker</h1>
        <p className="muted">
          {mode === "login" ? "Login to continue" : "Create your account"}
        </p>

        {mode === "register" && (
          <input name="name" placeholder="Full name" value={form.name} onChange={update} required />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} required />
        <input name="password" type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={update} required />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>

        <p className="muted switch">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <a href="#" onClick={(e) => { e.preventDefault(); setError(""); setMode(mode === "login" ? "register" : "login"); }}>
            {mode === "login" ? "Register" : "Login"}
          </a>
        </p>
      </form>
    </div>
  );
}
