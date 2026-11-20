require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// ---------- Auth middleware ----------
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Login required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

const makeToken = (user) =>
  jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// ---------- Auth routes ----------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res
        .status(400)
        .json({ error: "Name, email and password (min 6 chars) required" });

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length)
      return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hash]
    );
    const user = { id: result.insertId, name };
    res.status(201).json({ token: makeToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    const row = rows[0];
    if (!row || !(await bcrypt.compare(password || "", row.password_hash)))
      return res.status(401).json({ error: "Wrong email or password" });
    const user = { id: row.id, name: row.name };
    res.json({ token: makeToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- Transaction routes ----------
// GET /api/transactions?month=2026-11  (month optional)
app.get("/api/transactions", auth, async (req, res) => {
  try {
    const { month } = req.query;
    let sql = "SELECT id, type, category, amount, note, DATE_FORMAT(txn_date, '%Y-%m-%d') AS txn_date FROM transactions WHERE user_id = ?";
    const params = [req.user.id];
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      sql += " AND DATE_FORMAT(txn_date, '%Y-%m') = ?";
      params.push(month);
    }
    sql += " ORDER BY txn_date DESC, id DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/transactions", auth, async (req, res) => {
  try {
    const { type, category, amount, note, txn_date } = req.body;
    if (!["income", "expense"].includes(type))
      return res.status(400).json({ error: "Type must be income or expense" });
    if (!category || !txn_date || !(Number(amount) > 0))
      return res
        .status(400)
        .json({ error: "Category, date and a positive amount are required" });

    const [result] = await pool.query(
      "INSERT INTO transactions (user_id, type, category, amount, note, txn_date) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, type, category, amount, note || null, txn_date]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/transactions/:id", auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM transactions WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows)
      return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/summary?month=2026-11 -> totals + category-wise expense
app.get("/api/summary", auth, async (req, res) => {
  try {
    const { month } = req.query;
    let where = "WHERE user_id = ?";
    const params = [req.user.id];
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      where += " AND DATE_FORMAT(txn_date, '%Y-%m') = ?";
      params.push(month);
    }
    const [totals] = await pool.query(
      `SELECT type, COALESCE(SUM(amount), 0) AS total FROM transactions ${where} GROUP BY type`,
      params
    );
    const [byCategory] = await pool.query(
      `SELECT category, SUM(amount) AS total FROM transactions ${where} AND type = 'expense' GROUP BY category ORDER BY total DESC`,
      params
    );
    const income = Number(totals.find((t) => t.type === "income")?.total || 0);
    const expense = Number(totals.find((t) => t.type === "expense")?.total || 0);
    res.json({
      income,
      expense,
      balance: income - expense,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        total: Number(c.total),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
