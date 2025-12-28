const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');

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
  db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    metric_name TEXT,
    metric_value REAL,
    unit TEXT,
    test_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

const upload = multer({ dest: 'uploads/' });

// Simple Text Parser (Your Regex Logic)
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

// ENDPOINT: Upload File
app.post('/upload', upload.single('file'), (req, res) => {
  const userId = req.body.userId;
  if (!req.file) return res.status(400).send('No file.');

  fs.readFile(req.file.path, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading file.');
    
    const parsedRecords = parseHealthText(data, new Date().toISOString().split('T')[0]);
    
    if (parsedRecords.length > 0) {
      const stmt = db.prepare("INSERT INTO records (user_id, metric_name, metric_value, unit, test_date) VALUES (?, ?, ?, ?, ?)");
      parsedRecords.forEach(r => {
        stmt.run(userId, r.metric_name, r.metric_value, r.unit, r.test_date);
      });
      stmt.finalize();
    }
    
    fs.unlinkSync(req.file.path);
    res.json({ success: true, records: parsedRecords });
  });
});

// ENDPOINT: Manual Add
app.post('/add', (req, res) => {
  const { userId, records } = req.body;
  const stmt = db.prepare("INSERT INTO records (user_id, metric_name, metric_value, unit, test_date) VALUES (?, ?, ?, ?, ?)");
  records.forEach(r => {
    stmt.run(userId, r.metric_name, r.metric_value, r.unit, r.test_date);
  });
  stmt.finalize();
  res.json({ success: true });
});

// ENDPOINT: Get Records
// In backend/server.js
app.get('/records/:userId', (req, res) => {
    const userId = req.params.userId;
    // If user is 'undefined' from frontend, just return empty array instead of error
    if (!userId || userId === 'undefined') {
        return res.json([]);
    }
    db.all("SELECT * FROM records WHERE user_id = ? ORDER BY test_date DESC", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(port, () => console.log(`✅ Backend running on http://localhost:${port}`));