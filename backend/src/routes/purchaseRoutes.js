const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, deletePurchase } = require('../controllers/purchaseController');
const authenticateToken = require('../middleware/authMiddleware');
const { authorizeRoles, enforceBaseScope } = require('../middleware/rbacMiddleware');

router.get('/', authenticateToken, enforceBaseScope, getPurchases);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), createPurchase);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deletePurchase);

module.exports = router;
