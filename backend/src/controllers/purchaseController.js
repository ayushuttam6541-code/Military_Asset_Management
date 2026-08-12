const prisma = require('../config/database');

const getPurchases = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;

    const where = {};
    if (baseId) where.baseId = parseInt(baseId);
    if (equipmentTypeId) where.equipmentTypeId = parseInt(equipmentTypeId);
    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate);
      if (endDate) where.purchaseDate.lte = new Date(endDate);
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        base: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true, category: true } },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    res.json({ success: true, data: purchases });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createPurchase = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, quantity, purchaseDate, referenceNumber } = req.body;

    if (!baseId || !equipmentTypeId || !quantity || !purchaseDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    const purchase = await prisma.purchase.create({
      data: {
        baseId: parseInt(baseId),
        equipmentTypeId: parseInt(equipmentTypeId),
        quantity: parseInt(quantity),
        purchaseDate: new Date(purchaseDate),
        referenceNumber,
        createdBy: req.user.userId,
      },
      include: {
        base: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true } },
      },
    });

    // Update or create asset
    const existingAsset = await prisma.asset.findFirst({
      where: {
        baseId: parseInt(baseId),
        equipmentTypeId: parseInt(equipmentTypeId),
      },
    });

    if (existingAsset) {
      await prisma.asset.update({
        where: { id: existingAsset.id },
        data: { quantity: existingAsset.quantity + parseInt(quantity) },
      });
    } else {
      await prisma.asset.create({
        data: {
          baseId: parseInt(baseId),
          equipmentTypeId: parseInt(equipmentTypeId),
          quantity: parseInt(quantity),
          status: 'AVAILABLE',
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'PURCHASE',
        entityType: 'Purchase',
        entityId: purchase.id,
        details: `Created purchase of ${quantity} ${purchase.equipmentType.name} at ${purchase.base.name}`,
      },
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await prisma.purchase.findUnique({
      where: { id: parseInt(id) },
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    await prisma.purchase.delete({
      where: { id: parseInt(id) },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'DELETE',
        entityType: 'Purchase',
        entityId: parseInt(id),
        details: `Deleted purchase ${id}`,
      },
    });

    res.json({ success: true, message: 'Purchase deleted' });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPurchases, createPurchase, deletePurchase };
