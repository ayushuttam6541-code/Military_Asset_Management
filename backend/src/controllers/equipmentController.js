const prisma = require('../config/database');

const getEquipmentTypes = async (req, res) => {
  try {
    const equipmentTypes = await prisma.equipmentType.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: equipmentTypes });
  } catch (error) {
    console.error('Get equipment types error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createEquipmentType = async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    const validCategories = ['WEAPON', 'VEHICLE', 'AMMUNITION', 'OTHER'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const equipmentType = await prisma.equipmentType.create({
      data: { name, category },
    });

    res.status(201).json({ success: true, data: equipmentType });
  } catch (error) {
    console.error('Create equipment type error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getEquipmentTypes, createEquipmentType };
