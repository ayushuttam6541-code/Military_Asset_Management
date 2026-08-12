const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

module.exports = router;
