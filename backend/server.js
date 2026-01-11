const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { exec } = require('child_process');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// ---------------- DATABASE ----------------
const db = new sqlite3.Database('./health.db', (err) => {
  if (err) console.error("DB Error:", err.message);
  else console.log("✅ Connected to SQLite database.");
});

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  // Records table
  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      metric_name TEXT,
      metric_value REAL,
      unit TEXT,
      test_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// ---------------- AUTH ----------------

// SIGNUP
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hashedPassword],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "User already exists" });
      }
      res.json({ success: true, userId: this.lastID });
    }
  );
});

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ success: true, userId: user.id });
    }
  );
});

// ---------------- FILE UPLOAD ----------------
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
  const userId = req.body.userId;

  if (!userId) return res.status(400).json({ error: "Missing userId" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;
  console.log(`🚀 Processing file: ${req.file.originalname}`);

  exec(`python services/pdf_processor.py "${filePath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Python error:", error.message);
      fs.unlinkSync(filePath);
      return res.status(500).json({ error: "AI processing failed" });
    }

    try {
      const lines = stdout.trim().split('\n');
      const jsonString = lines[lines.length - 1];
      const records = JSON.parse(jsonString);

      const stmt = db.prepare(`
        INSERT INTO records (user_id, metric_name, metric_value, unit, test_date)
        VALUES (?, ?, ?, ?, ?)
      `);

      const today = new Date().toISOString().split('T')[0];

      records.forEach(r => {
        stmt.run(
          userId,
          r.name || r.original_name,
          r.value,
          r.unit || '',
          r.test_date || today
        );
      });

      stmt.finalize();
      fs.unlinkSync(filePath);

      res.json({ success: true, records });
    } catch (err) {
      console.error("❌ Parsing error:", stdout);
      fs.unlinkSync(filePath);
      res.status(500).json({ error: "Invalid AI output" });
    }
  });
});

// ---------------- MANUAL ADD ----------------
app.post('/add', (req, res) => {
  const { userId, records } = req.body;

  if (!userId || !records) {
    return res.status(400).json({ error: "Missing data" });
  }

  const stmt = db.prepare(`
    INSERT INTO records (user_id, metric_name, metric_value, unit, test_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  records.forEach(r => {
    stmt.run(userId, r.metric_name, r.metric_value, r.unit, r.test_date);
  });

  stmt.finalize();
  res.json({ success: true });
});

// ---------------- GET RECORDS ----------------
app.get('/records/:userId', (req, res) => {
  const userId = req.params.userId;

  db.all(
    "SELECT * FROM records WHERE user_id = ? ORDER BY test_date DESC",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ---------------- SERVER ----------------
app.listen(port, () => {
  console.log(`✅ Backend running on http://localhost:${port}`);
});
