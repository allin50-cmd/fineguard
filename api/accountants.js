const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const XLSX = require('xlsx');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get all accountants
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM accountants
      ORDER BY firm_name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching accountants:', error);
    res.status(500).json({ error: 'Failed to fetch accountants' });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT borough) as boroughs,
        COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') as "withEmail",
        COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone != '') as "withPhone",
        COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '') as "withWebsite"
      FROM accountants
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get borough statistics
router.get('/borough-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM accountant_borough_stats
      ORDER BY record_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching borough stats:', error);
    res.status(500).json({ error: 'Failed to fetch borough statistics' });
  }
});

// Search accountants
router.get('/search', async (req, res) => {
  try {
    const { q, borough } = req.query;
    let query = 'SELECT * FROM accountants WHERE 1=1';
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      query += ` AND (
        firm_name ILIKE $${params.length} OR
        services_specialisms ILIKE $${params.length} OR
        borough ILIKE $${params.length}
      )`;
    }

    if (borough) {
      params.push(borough);
      query += ` AND borough = $${params.length}`;
    }

    query += ' ORDER BY firm_name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching accountants:', error);
    res.status(500).json({ error: 'Failed to search accountants' });
  }
});

// Get single accountant
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM accountants WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Accountant not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching accountant:', error);
    res.status(500).json({ error: 'Failed to fetch accountant' });
  }
});

// Create accountant
router.post('/', async (req, res) => {
  try {
    const {
      borough,
      firm_name,
      company_number,
      primary_contact,
      phone,
      email,
      address,
      postcode,
      website,
      represents_regulates,
      services_specialisms,
      source_contact,
      notes
    } = req.body;

    const userId = req.user?.id || null;

    const result = await pool.query(`
      INSERT INTO accountants (
        borough, firm_name, company_number, primary_contact,
        phone, email, address, postcode, website,
        represents_regulates, services_specialisms, source_contact,
        notes, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
      RETURNING *
    `, [
      borough,
      firm_name,
      company_number,
      primary_contact,
      phone,
      email,
      address,
      postcode,
      website,
      represents_regulates,
      services_specialisms,
      source_contact,
      notes,
      userId
    ]);

    // Refresh borough stats
    await pool.query('SELECT refresh_borough_stats()');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating accountant:', error);
    res.status(500).json({ error: 'Failed to create accountant' });
  }
});

// Update accountant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      borough,
      firm_name,
      company_number,
      primary_contact,
      phone,
      email,
      address,
      postcode,
      website,
      represents_regulates,
      services_specialisms,
      source_contact,
      notes
    } = req.body;

    const userId = req.user?.id || null;

    const result = await pool.query(`
      UPDATE accountants SET
        borough = $1,
        firm_name = $2,
        company_number = $3,
        primary_contact = $4,
        phone = $5,
        email = $6,
        address = $7,
        postcode = $8,
        website = $9,
        represents_regulates = $10,
        services_specialisms = $11,
        source_contact = $12,
        notes = $13,
        updated_by = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `, [
      borough,
      firm_name,
      company_number,
      primary_contact,
      phone,
      email,
      address,
      postcode,
      website,
      represents_regulates,
      services_specialisms,
      source_contact,
      notes,
      userId,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Accountant not found' });
    }

    // Refresh borough stats
    await pool.query('SELECT refresh_borough_stats()');

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating accountant:', error);
    res.status(500).json({ error: 'Failed to update accountant' });
  }
});

// Delete accountant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM accountants WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Accountant not found' });
    }

    // Refresh borough stats
    await pool.query('SELECT refresh_borough_stats()');

    res.json({ message: 'Accountant deleted successfully' });
  } catch (error) {
    console.error('Error deleting accountant:', error);
    res.status(500).json({ error: 'Failed to delete accountant' });
  }
});

// Export to Excel
router.get('/export', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        borough as "Borough",
        firm_name as "Firm / Accountant",
        company_number as "Company Number",
        primary_contact as "Primary contact (listed)",
        phone as "Phone",
        email as "Email",
        address as "Address",
        postcode as "Postcode",
        website as "Website",
        represents_regulates as "Represents / regulates",
        services_specialisms as "Services / specialisms (as listed)",
        source_contact as "Source (contact)",
        notes as "Notes"
      FROM accountants
      ORDER BY borough, firm_name
    `);

    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Accountants');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=accountants_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting accountants:', error);
    res.status(500).json({ error: 'Failed to export accountants' });
  }
});

module.exports = router;
