const express = require('express');
const router = express.Router();
const { getAssignments, createAssignment, returnAssignment } = require('../controllers/assignmentController');
const authenticateToken = require('../middleware/authMiddleware');
const { authorizeRoles, enforceBaseScope } = require('../middleware/rbacMiddleware');

router.get('/', authenticateToken, enforceBaseScope, getAssignments);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), createAssignment);
router.patch('/:id/return', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), returnAssignment);

module.exports = router;
