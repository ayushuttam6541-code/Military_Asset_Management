const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const authenticateToken = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

router.get('/', authenticateToken, authorizeRoles('ADMIN'), getAuditLogs);

module.exports = router;
