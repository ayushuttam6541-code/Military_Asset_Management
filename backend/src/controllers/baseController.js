const prisma = require('../config/database');

const getBases = async (req, res) => {
  try {
    const bases = await prisma.base.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: bases });
  } catch (error) {
    console.error('Get bases error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getBases };
