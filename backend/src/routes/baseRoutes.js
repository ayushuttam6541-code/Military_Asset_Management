const express = require('express');
const router = express.Router();
const { getBases } = require('../controllers/baseController');

router.get('/', getBases);

module.exports = router;
