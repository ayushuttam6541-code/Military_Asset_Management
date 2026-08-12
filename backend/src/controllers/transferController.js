const prisma = require('../config/database');

const getTransfers = async (req, res) => {
  try {
    const { baseId, status } = req.query;

    const where = {};
    if (baseId) {
      where.OR = [
        { sourceBaseId: parseInt(baseId) },
        { destinationBaseId: parseInt(baseId) },
      ];
    }
    if (status) where.status = status;

    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        sourceBase: { select: { id: true, name: true } },
        destinationBase: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true, category: true } },
        initiator: { select: { id: true, username: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ success: true, data: transfers });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createTransfer = async (req, res) => {
  try {
    const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity } = req.body;

    if (!sourceBaseId || !destinationBaseId || !equipmentTypeId || !quantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (sourceBaseId === destinationBaseId) {
      return res.status(400).json({ success: false, message: 'Source and destination bases cannot be the same' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    // Check source inventory
    const sourceAsset = await prisma.asset.findFirst({
      where: {
        baseId: parseInt(sourceBaseId),
        equipmentTypeId: parseInt(equipmentTypeId),
      },
    });

    if (!sourceAsset || sourceAsset.quantity < parseInt(quantity)) {
      return res.status(400).json({ success: false, message: 'Insufficient inventory at source base' });
    }

    await prisma.$transaction(async (tx) => {
      // Decrease source inventory
      await tx.asset.update({
        where: { id: sourceAsset.id },
        data: { quantity: sourceAsset.quantity - parseInt(quantity) },
      });

      // Increase destination inventory
      const destAsset = await tx.asset.findFirst({
        where: {
          baseId: parseInt(destinationBaseId),
          equipmentTypeId: parseInt(equipmentTypeId),
        },
      });

      if (destAsset) {
        await tx.asset.update({
          where: { id: destAsset.id },
          data: { quantity: destAsset.quantity + parseInt(quantity) },
        });
      } else {
        await tx.asset.create({
          data: {
            baseId: parseInt(destinationBaseId),
            equipmentTypeId: parseInt(equipmentTypeId),
            quantity: parseInt(quantity),
            status: 'AVAILABLE',
          },
        });
      }

      // Create transfer record
      const transfer = await tx.transfer.create({
        data: {
          sourceBaseId: parseInt(sourceBaseId),
          destinationBaseId: parseInt(destinationBaseId),
          equipmentTypeId: parseInt(equipmentTypeId),
          quantity: parseInt(quantity),
          status: 'COMPLETED',
          initiatedBy: req.user.userId,
        },
        include: {
          sourceBase: { select: { id: true, name: true } },
          destinationBase: { select: { id: true, name: true } },
          equipmentType: { select: { id: true, name: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'TRANSFER_COMPLETED',
          entityType: 'Transfer',
          entityId: transfer.id,
          details: `Transferred ${quantity} ${transfer.equipmentType.name} from ${transfer.sourceBase.name} to ${transfer.destinationBase.name}`,
        },
      });

      return transfer;
    });

    res.status(201).json({ success: true, message: 'Transfer completed successfully' });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ success: false, message: 'Server error during transfer' });
  }
};

const updateTransferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const transfer = await prisma.transfer.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        sourceBase: { select: { id: true, name: true } },
        destinationBase: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'TRANSFER_STATUS_UPDATE',
        entityType: 'Transfer',
        entityId: parseInt(id),
        details: `Updated transfer ${id} status to ${status}`,
      },
    });

    res.json({ success: true, data: transfer });
  } catch (error) {
    console.error('Update transfer status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getTransfers, createTransfer, updateTransferStatus };
