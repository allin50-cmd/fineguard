const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get companies with pagination and search
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, search, status } = req.query;

    let query = 'SELECT * FROM companies_house_full WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      params.push(`%${search}%`);
      query += ` AND (company_name ILIKE $${paramCount} OR company_number ILIKE $${paramCount})`;
    }

    if (status) {
      paramCount++;
      params.push(status);
      query += ` AND company_status = $${paramCount}`;
    }

    query += ` ORDER BY company_name ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM companies_house_full WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countParams.push(`%${search}%`);
      countQuery += ` AND (company_name ILIKE $${countParamCount} OR company_number ILIKE $${countParamCount})`;
    }

    if (status) {
      countParamCount++;
      countParams.push(status);
      countQuery += ` AND company_status = $${countParamCount}`;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      companies: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE company_status = 'Active') as active,
        COUNT(*) FILTER (WHERE company_status = 'Dissolved') as dissolved,
        COUNT(*) FILTER (WHERE company_status = 'Liquidation') as liquidation
      FROM companies_house_full
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
