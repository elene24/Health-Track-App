const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Initialize Database
const db = new sqlite3.Database('./health.db', (err) => {
  if (err) console.error("DB Error:", err.message);
  else console.log("✅ Connected to SQLite database.");
});

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Records table
  db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    metric_name TEXT,
    metric_value REAL,
    unit TEXT,
    test_date TEXT,
    notes TEXT,
    source TEXT DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

const upload = multer({ dest: 'uploads/' });

// --- Authentication ---

// SIGN UP
app.post('/auth/signup', async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    db.run(
      'INSERT INTO users (id, full_name, email, password) VALUES (?, ?, ?, ?)',
      [id, fullName, email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, user: { id, fullName, email } });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SIGN IN
app.post('/auth/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ success: true, user: { id: user.id, fullName: user.full_name, email: user.email } });
  });
});

// --- Health Records ---

// Upload File
app.post('/upload', upload.single('file'), (req, res) => {
  const userId = req.body.userId;
  if (!req.file) return res.status(400).send('No file.');

  fs.readFile(req.file.path, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading file.');

    const parsedRecords = parseHealthText(data, new Date().toISOString().split('T')[0]);

    if (parsedRecords.length > 0) {
      const stmt = db.prepare(
        "INSERT INTO records (user_id, metric_name, metric_value, unit, test_date, source) VALUES (?, ?, ?, ?, ?, ?)"
      );
      parsedRecords.forEach(r => {
        stmt.run(userId, r.metric_name, r.metric_value, r.unit, r.test_date, 'file_upload');
      });
      stmt.finalize();
    }

    fs.unlinkSync(req.file.path);
    res.json({ success: true, records: parsedRecords });
  });
});

// Manual Add
app.post('/add', (req, res) => {
  const { userId, records } = req.body;
  if (!userId || !records || !records.length) return res.status(400).json({ error: 'Invalid request' });

  const stmt = db.prepare(
    "INSERT INTO records (user_id, metric_name, metric_value, unit, test_date, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  records.forEach(r => {
    stmt.run(userId, r.metric_name, r.metric_value, r.unit, r.test_date, r.notes || null, r.source || 'manual');
  });

  stmt.finalize();
  res.json({ success: true });
});

// Get Records
app.get('/records/:userId', (req, res) => {
  const userId = req.params.userId;
  if (!userId || userId === 'undefined') return res.json([]);

  db.all("SELECT * FROM records WHERE user_id = ? ORDER BY test_date DESC", [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// UPDATE a record
app.put('/records/:id', (req, res) => {
  const id = req.params.id;
  const { metric_value, metric_name, unit, test_date, notes } = req.body;

  db.run(
    `UPDATE records 
     SET metric_value = ?, metric_name = ?, unit = ?, test_date = ?, notes = ?
     WHERE id = ?`,
    [metric_value, metric_name, unit, test_date, notes, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Record not found' });
      res.json({ success: true });
    }
  );
});

// DELETE a record
app.delete('/records/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM records WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ success: true });
  });
});

// --- Utility Function ---
function parseHealthText(text, defaultDate) {
  const lines = text.split('\n');
  const records = [];
  let extractedDate = defaultDate;

  const dateMatch = text.match(/Date:\s*(\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) extractedDate = dateMatch[1];

  const metricRegex = /([a-zA-Z\s]+)[:=]\s*([\d\.]+)\s*([a-zA-Z%\/]+)?/;

  lines.forEach(line => {
    const match = line.match(metricRegex);
    if (match) {
      const name = match[1].trim();
      if (name.toLowerCase() === 'date') return;
      records.push({
        metric_name: name,
        metric_value: parseFloat(match[2]),
        unit: match[3] ? match[3].trim() : '',
        test_date: extractedDate
      });
    }
  });

  return records;
}

// Start Server
app.listen(port, () => console.log(`✅ Backend running on http://localhost:${port}`));
