const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  res.json({ token: 'test-token', user: { id: 1, email: 'admin@fineguard.com' } });
});

module.exports = router;
