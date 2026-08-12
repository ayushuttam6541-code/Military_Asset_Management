const express = require('express');
const router = express.Router();
const { getExpenditures, createExpenditure } = require('../controllers/expenditureController');
const authenticateToken = require('../middleware/authMiddleware');
const { authorizeRoles, enforceBaseScope } = require('../middleware/rbacMiddleware');

router.get('/', authenticateToken, enforceBaseScope, getExpenditures);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), createExpenditure);

module.exports = router;
