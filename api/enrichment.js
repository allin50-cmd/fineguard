const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get enriched companies
router.get('/companies', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM enriched_companies
      ORDER BY enriched_at DESC
      LIMIT 500
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching enriched companies:', error);
    res.status(500).json({ error: 'Failed to fetch enriched companies' });
  }
});

// Get enrichment statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE source = 'perplexity') as perplexity,
        COUNT(*) FILTER (WHERE source = 'generated') as generated,
        COUNT(*) FILTER (WHERE confidence >= 80) as "highConfidence"
      FROM enriched_companies
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching enrichment stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
