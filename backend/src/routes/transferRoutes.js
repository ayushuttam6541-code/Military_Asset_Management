const express = require('express');
const router = express.Router();
const { getTransfers, createTransfer, updateTransferStatus } = require('../controllers/transferController');
const authenticateToken = require('../middleware/authMiddleware');
const { authorizeRoles, enforceBaseScope } = require('../middleware/rbacMiddleware');

router.get('/', authenticateToken, enforceBaseScope, getTransfers);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), createTransfer);
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), updateTransferStatus);

module.exports = router;
