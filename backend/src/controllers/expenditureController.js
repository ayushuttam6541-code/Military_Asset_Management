const prisma = require('../config/database');

const getExpenditures = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;

    const where = {};
    if (baseId) where.baseId = parseInt(baseId);
    if (equipmentTypeId) where.equipmentTypeId = parseInt(equipmentTypeId);
    if (startDate || endDate) {
      where.expendedAt = {};
      if (startDate) where.expendedAt.gte = new Date(startDate);
      if (endDate) where.expendedAt.lte = new Date(endDate);
    }

    const expenditures = await prisma.expenditure.findMany({
      where,
      include: {
        base: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true, category: true } },
      },
      orderBy: { expendedAt: 'desc' },
    });

    res.json({ success: true, data: expenditures });
  } catch (error) {
    console.error('Get expenditures error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createExpenditure = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, quantity, reason } = req.body;

    if (!baseId || !equipmentTypeId || !quantity || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    // Check available inventory
    const asset = await prisma.asset.findFirst({
      where: {
        baseId: parseInt(baseId),
        equipmentTypeId: parseInt(equipmentTypeId),
      },
    });

    if (!asset || asset.quantity < parseInt(quantity)) {
      return res.status(400).json({ success: false, message: 'Insufficient inventory' });
    }

    // Create expenditure
    const expenditure = await prisma.expenditure.create({
      data: {
        baseId: parseInt(baseId),
        equipmentTypeId: parseInt(equipmentTypeId),
        quantity: parseInt(quantity),
        reason,
        recordedBy: req.user.userId,
      },
      include: {
        base: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true } },
      },
    });

    // Update asset quantity
    await prisma.asset.update({
      where: { id: asset.id },
      data: { quantity: asset.quantity - parseInt(quantity) },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'EXPENDITURE',
        entityType: 'Expenditure',
        entityId: expenditure.id,
        details: `Recorded expenditure of ${quantity} ${expenditure.equipmentType.name} for: ${reason}`,
      },
    });

    res.status(201).json({ success: true, data: expenditure });
  } catch (error) {
    console.error('Create expenditure error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getExpenditures, createExpenditure };
