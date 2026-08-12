const express = require('express');
const router = express.Router();
const { getEquipmentTypes, createEquipmentType } = require('../controllers/equipmentController');
const authenticateToken = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

router.get('/', authenticateToken, getEquipmentTypes);
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createEquipmentType);

module.exports = router;
