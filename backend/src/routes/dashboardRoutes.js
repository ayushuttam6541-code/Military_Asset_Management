const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/authMiddleware');
const { enforceBaseScope } = require('../middleware/rbacMiddleware');

router.get('/metrics', authenticateToken, enforceBaseScope, getDashboardMetrics);

module.exports = router;
