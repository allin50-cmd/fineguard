const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get client dashboard data with real Companies House deadlines
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user?.id || 1; // TODO: Get from auth

    // Get client's company
    const clientResult = await pool.query(`
      SELECT * FROM clients WHERE user_id = $1 LIMIT 1
    `, [userId]);

    if (!clientResult.rows.length) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = clientResult.rows[0];

    // Get company from Companies House data
    const companyResult = await pool.query(`
      SELECT * FROM companies_house_full
      WHERE company_number = $1 OR company_name ILIKE $2
      LIMIT 1
    `, [client.company_number, `%${client.company_name}%`]);

    const company = companyResult.rows[0];

    // Calculate upcoming deadlines from Companies House data
    const deadlines = [];

    if (company) {
      const incorporationDate = new Date(company.incorporation_date);
      const accountsDate = company.accounts_next_due_date ? new Date(company.accounts_next_due_date) : null;
      const confirmationDate = company.confirmation_statement_next_due ? new Date(company.confirmation_statement_next_due) : null;

      // Add accounts deadline
      if (accountsDate && accountsDate > new Date()) {
        const daysUntil = Math.ceil((accountsDate - new Date()) / (1000 * 60 * 60 * 24));
        deadlines.push({
          id: 'accounts',
          deadline_type: 'Annual Accounts',
          deadline_date: accountsDate.toISOString(),
          case_title: `${company.company_name} - Annual Accounts`,
          status: daysUntil < 30 ? 'urgent' : 'upcoming',
          days_until: daysUntil
        });
      }

      // Add confirmation statement deadline
      if (confirmationDate && confirmationDate > new Date()) {
        const daysUntil = Math.ceil((confirmationDate - new Date()) / (1000 * 60 * 60 * 24));
        deadlines.push({
          id: 'confirmation',
          deadline_type: 'Confirmation Statement',
          deadline_date: confirmationDate.toISOString(),
          case_title: `${company.company_name} - Confirmation Statement`,
          status: daysUntil < 14 ? 'urgent' : 'upcoming',
          days_until: daysUntil
        });
      }
    }

    // Calculate compliance health score
    let healthScore = 100;

    if (company) {
      // Deduct points for issues
      if (company.company_status !== 'Active') healthScore -= 30;
      if (!company.accounts_next_due_date) healthScore -= 20;
      if (!company.confirmation_statement_next_due) healthScore -= 15;

      // Deduct for approaching deadlines
      deadlines.forEach(d => {
        if (d.days_until < 7) healthScore -= 20;
        else if (d.days_until < 14) healthScore -= 10;
        else if (d.days_until < 30) healthScore -= 5;
      });

      healthScore = Math.max(0, healthScore);
    }

    // Get metrics
    const metrics = {
      activeCases: deadlines.length,
      upcomingDeadlines: deadlines.filter(d => d.days_until <= 30).length,
      documentsCount: 0, // TODO: Count actual documents
      accountStatus: company?.company_status || 'Unknown'
    };

    res.json({
      client,
      company,
      metrics,
      upcomingDeadlines: deadlines.sort((a, b) => a.days_until - b.days_until).slice(0, 5),
      recentCases: [], // TODO: Implement case history
      healthScore: {
        score: healthScore,
        trend: 'stable',
        lastCalculated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Recalculate compliance health score
router.post('/compliance/recalculate/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    // Get client
    const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    if (!clientResult.rows.length) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = clientResult.rows[0];

    // Get company data
    const companyResult = await pool.query(`
      SELECT * FROM companies_house_full
      WHERE company_number = $1
      LIMIT 1
    `, [client.company_number]);

    const company = companyResult.rows[0];

    let healthScore = 100;

    if (company) {
      if (company.company_status !== 'Active') healthScore -= 30;
      if (!company.accounts_next_due_date) healthScore -= 20;
      if (!company.confirmation_statement_next_due) healthScore -= 15;

      const accountsDate = company.accounts_next_due_date ? new Date(company.accounts_next_due_date) : null;
      if (accountsDate) {
        const daysUntil = Math.ceil((accountsDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntil < 7) healthScore -= 20;
        else if (daysUntil < 14) healthScore -= 10;
        else if (daysUntil < 30) healthScore -= 5;
      }

      healthScore = Math.max(0, healthScore);
    }

    res.json({
      healthScore: {
        score: healthScore,
        trend: 'stable',
        lastCalculated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error recalculating health score:', error);
    res.status(500).json({ error: 'Failed to recalculate health score' });
  }
});

// Get alerts for a client
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user?.id || 1;

    // Get client
    const clientResult = await pool.query('SELECT * FROM clients WHERE user_id = $1 LIMIT 1', [userId]);
    if (!clientResult.rows.length) {
      return res.json({ alerts: [] });
    }

    const client = clientResult.rows[0];

    // Get company deadlines
    const companyResult = await pool.query(`
      SELECT * FROM companies_house_full
      WHERE company_number = $1
      LIMIT 1
    `, [client.company_number]);

    const company = companyResult.rows[0];
    const alerts = [];

    if (company) {
      const accountsDate = company.accounts_next_due_date ? new Date(company.accounts_next_due_date) : null;
      const confirmationDate = company.confirmation_statement_next_due ? new Date(company.confirmation_statement_next_due) : null;

      if (accountsDate && accountsDate > new Date()) {
        const daysUntil = Math.ceil((accountsDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 30) {
          alerts.push({
            type: daysUntil < 7 ? 'critical' : 'warning',
            title: 'Annual Accounts Due Soon',
            message: `Your annual accounts are due in ${daysUntil} days (${accountsDate.toLocaleDateString()})`,
            date: new Date().toISOString()
          });
        }
      }

      if (confirmationDate && confirmationDate > new Date()) {
        const daysUntil = Math.ceil((confirmationDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 14) {
          alerts.push({
            type: daysUntil < 7 ? 'critical' : 'warning',
            title: 'Confirmation Statement Due',
            message: `Your confirmation statement is due in ${daysUntil} days (${confirmationDate.toLocaleDateString()})`,
            date: new Date().toISOString()
          });
        }
      }

      if (company.company_status !== 'Active') {
        alerts.push({
          type: 'critical',
          title: 'Company Status Issue',
          message: `Your company status is "${company.company_status}". Please contact support.`,
          date: new Date().toISOString()
        });
      }
    }

    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

module.exports = router;
