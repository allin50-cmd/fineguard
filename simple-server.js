const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors({ origin: '*' }));
app.set("trust proxy", 1);
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Companies stats
app.get('/api/companies/stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM companies');
    res.json({ total: result.rows[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUTH ENDPOINTS ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
      [email, hash, fullName || null]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASKS (protected) ---
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DOCUMENTS (protected, uses /tmp/uploads) ---
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/documents/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { company_id, category, year } = req.body;
    const file = req.file;
    const result = await pool.query(
      'INSERT INTO documents (user_id, company_id, filename, file_url, file_size, category, year) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, company_id, file.originalname, `/uploads/${file.filename}`, file.size, category, year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE user_id = $1 ORDER BY uploaded_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SUBSCRIPTION (protected) ---
app.get('/api/subscription', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.json({ plan: 'starter', status: 'inactive' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BILLING (placeholder) ---
app.get('/api/billing/methods', authenticateToken, (req, res) => {
  res.json([{ id: 1, type: 'VISA', last4: '4242', expiry: '12/25' }]);
});

app.listen(port, () => {
  console.log(`FineGuard backend running on port ${port}`);
});

// --- DOCUMENTS with memoryStorage (no disk write) ---
app.post('/api/documents/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { company_id, category, year } = req.body;
    const file = req.file;
    // No file written to disk – store only metadata
    const result = await pool.query(
      'INSERT INTO documents (user_id, company_id, filename, file_url, file_size, category, year) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, company_id, file.originalname, 'in-memory', file.size, category, year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
