const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./health.db", (err) => {
  if (err) console.error("DB Error:", err.message);
  else console.log("✅ Connected to SQLite database.");
});

function generateAccessCode() {
  // 8 char hex code like: A3F19C2D
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

db.serialize(() => {
  // Users table
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  // Records table
  db.run(
    `CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      metric_name TEXT,
      metric_value REAL,
      unit TEXT,
      test_date TEXT,
      notes TEXT,
      source TEXT DEFAULT 'manual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  // ---- MIGRATIONS: records
  db.run(`ALTER TABLE records ADD COLUMN notes TEXT`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("notes migration error:", err.message);
    }
  });

  db.run(`ALTER TABLE records ADD COLUMN source TEXT DEFAULT 'manual'`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("source migration error:", err.message);
    }
  });

  db.run(`ALTER TABLE records ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("created_at migration error:", err.message);
    }
  });

  // ---- MIGRATION: users.access_code
  db.run(`ALTER TABLE users ADD COLUMN access_code TEXT`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("access_code migration error:", err.message);
    }
  });

  // Fill missing access codes for existing users
  db.all(`SELECT id FROM users WHERE access_code IS NULL OR access_code = ''`, (err, rows) => {
    if (err) {
      console.error("fill access_code select error:", err.message);
      return;
    }
    if (!rows || rows.length === 0) return;

    const stmt = db.prepare(`UPDATE users SET access_code = ? WHERE id = ?`);
    rows.forEach((r) => {
      stmt.run(generateAccessCode(), r.id);
    });
    stmt.finalize();
    console.log(`✅ Filled access_code for ${rows.length} existing user(s).`);
  });
});

const upload = multer({ dest: "uploads/" });

// --- Authentication ---
app.post("/auth/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const accessCode = generateAccessCode();

    db.run(
      "INSERT INTO users (id, full_name, email, password, access_code) VALUES (?, ?, ?, ?, ?)",
      [id, fullName, email, hashedPassword, accessCode],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "Email already exists" });
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, user: { id, fullName, email, accessCode } });
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        accessCode: user.access_code, // ✅ include it so user can see/share it
      },
    });
  });
});

// ✅ NEW: verify guest access
app.post("/access/verify", (req, res) => {
  const { email, accessCode } = req.body;
  if (!email || !accessCode) return res.status(400).json({ error: "Missing fields" });

  db.get(
    "SELECT id FROM users WHERE email = ? AND access_code = ?",
    [email, accessCode],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: "Invalid email or code" });

      res.json({ success: true, userId: row.id });
    }
  );
});

// --- Health Records ---
app.post("/upload", upload.single("file"), (req, res) => {
  const userId = req.body.userId;
  if (!userId) return res.status(400).json({ success: false, error: "Missing userId." });
  if (!req.file) return res.status(400).json({ success: false, error: "No file." });

  fs.readFile(req.file.path, "utf8", (err, data) => {
    if (err) return res.status(500).json({ success: false, error: "Error reading file." });

    const parsedRecords = parseHealthText(data, new Date().toISOString().split("T")[0]);

    if (parsedRecords.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: "No data found in file", records: [] });
    }

    const stmt = db.prepare(
      "INSERT INTO records (user_id, metric_name, metric_value, unit, test_date, source) VALUES (?, ?, ?, ?, ?, ?)"
    );

    parsedRecords.forEach((r) => {
      stmt.run(userId, r.metric_name, r.metric_value, r.unit, r.test_date, "file_upload");
    });
    stmt.finalize();

    fs.unlinkSync(req.file.path);
    return res.json({ success: true, records: parsedRecords });
  });
});

app.post("/add", (req, res) => {
  const { userId, records } = req.body;
  if (!userId || !Array.isArray(records) || !records.length) return res.status(400).json({ error: "Invalid request" });

  const stmt = db.prepare(
    "INSERT INTO records (user_id, metric_name, metric_value, unit, test_date, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  records.forEach((r) => {
    stmt.run(
      userId,
      r.metric_name,
      r.metric_value,
      r.unit,
      r.test_date,
      r.notes || null,
      r.source || "manual"
    );
  });

  stmt.finalize();
  res.json({ success: true });
});

app.get("/records/:userId", (req, res) => {
  const userId = req.params.userId;
  if (!userId || userId === "undefined") return res.json([]);

  db.all("SELECT * FROM records WHERE user_id = ? ORDER BY test_date DESC", [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put("/records/:id", (req, res) => {
  const id = req.params.id;
  const { metric_value, metric_name, unit, test_date, notes } = req.body;

  const updates = [];
  const values = [];

  if (metric_value !== undefined) { updates.push("metric_value = ?"); values.push(Number(metric_value)); }
  if (metric_name !== undefined)  { updates.push("metric_name = ?");  values.push(metric_name); }
  if (unit !== undefined)         { updates.push("unit = ?");         values.push(unit); }
  if (test_date !== undefined)    { updates.push("test_date = ?");    values.push(test_date); }
  if (notes !== undefined)        { updates.push("notes = ?");        values.push(notes); }

  if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

  values.push(id);

  db.run(`UPDATE records SET ${updates.join(", ")} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ success: true });
  });
});

app.delete("/records/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM records WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ success: true });
  });
});

// --- Utility Function ---
function parseHealthText(text, defaultDate) {
  const lines = text.split("\n");
  const records = [];
  let extractedDate = defaultDate;

  const dateMatch = text.match(/Date:\s*(\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) extractedDate = dateMatch[1];

  const metricRegex = /([a-zA-Z\s]+)[:=]\s*([\d\.]+)\s*([a-zA-Z%\/]+)?/;

  lines.forEach((line) => {
    const match = line.match(metricRegex);
    if (match) {
      const name = match[1].trim();
      if (name.toLowerCase() === "date") return;
      records.push({
        metric_name: name,
        metric_value: parseFloat(match[2]),
        unit: match[3] ? match[3].trim() : "",
        test_date: extractedDate,
      });
    }
  });

  return records;
}

app.listen(port, () => console.log(`✅ Backend running on http://localhost:${port}`));